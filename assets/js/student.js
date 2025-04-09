// student.js

document.getElementById('connect-zoom').addEventListener('click', async function () {
  try {
      const response = await fetch('http://localhost:3000/zoom/auth');
      
      if (response.ok) {
          // Assuming the response from your backend contains the accessToken
          const data = await response.json();
          const accessToken = data.accessToken;
          
          // Send the accessToken to the backend to create a Zoom meeting
          const meetingResponse = await fetch('http://localhost:3000/zoom/meeting', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  accessToken: accessToken,
              }),
          });
          
          if (meetingResponse.ok) {
              const meetingData = await meetingResponse.json();
              alert(`Session booked successfully! Zoom link: ${meetingData.meetingLink}`);
          } else {
              alert('Failed to create meeting');
          }
      } else {
          alert('Zoom authentication failed');
      }
  } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
  }
});
