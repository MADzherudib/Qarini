document.getElementById('studentForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get values from the form
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const teacherEmail = document.getElementById('teacherEmail').value;

    try {
        const response = await fetch('http://localhost:3000/zoom/meeting', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                subject,
                date,
                time,
                teacherEmail
            }),
        });

        const data = await response.json();
        if (data.authUrl) {
            // If user is not authenticated with Zoom, redirect to Zoom OAuth
            window.location.href = data.authUrl;
        } else {
            // If meeting was created successfully, show the meeting link or an error
            alert(data.message || `Meeting created! Join at: ${data.meetingLink}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});
