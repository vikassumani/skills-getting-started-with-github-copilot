document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function renderParticipants(name, details, participantsList, participantsTitle, availabilityText) {
    participantsTitle.textContent = `Participants (${details.participants.length})`;
    availabilityText.textContent = `${details.max_participants - details.participants.length} spots left`;
    participantsList.replaceChildren();

    if (details.participants.length === 0) {
      const emptyMessage = document.createElement("li");
      emptyMessage.className = "no-participants";
      emptyMessage.textContent = "No participants yet";
      participantsList.appendChild(emptyMessage);
      return;
    }

    details.participants.forEach((participant) => {
      const listItem = document.createElement("li");
      listItem.className = "participant-item";

      const email = document.createElement("span");
      email.textContent = participant;

      const unregisterButton = document.createElement("button");
      unregisterButton.type = "button";
      unregisterButton.className = "unregister-button";
      unregisterButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
      unregisterButton.title = `Unregister ${participant}`;
      unregisterButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6" />
        </svg>
      `;
      unregisterButton.addEventListener("click", async () => {
        unregisterButton.disabled = true;
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(participant)}`,
            { method: "DELETE" }
          );
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.detail || "Failed to unregister participant");
          }

          const participantIndex = details.participants.indexOf(participant);
          if (participantIndex !== -1) {
            details.participants.splice(participantIndex, 1);
          }
          renderParticipants(name, details, participantsList, participantsTitle, availabilityText);
        } catch (error) {
          messageDiv.textContent = error.message || "Failed to unregister participant. Please try again.";
          messageDiv.className = "error";
          messageDiv.classList.remove("hidden");
          console.error("Error unregistering participant:", error);
          unregisterButton.disabled = false;
        }
      });

      listItem.append(email, unregisterButton);
      participantsList.appendChild(listItem);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;

        const description = document.createElement("p");
        description.textContent = details.description;

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.appendChild(scheduleLabel);
        schedule.append(details.schedule);

        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        availability.appendChild(availabilityLabel);
        const availabilityText = document.createTextNode(`${spotsLeft} spots left`);
        availability.appendChild(availabilityText);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = `Participants (${details.participants.length})`;

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";
        renderParticipants(name, details, participantsList, participantsTitle, availabilityText);

        participantsSection.append(participantsTitle, participantsList);
        activityCard.append(title, description, schedule, availability, participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
