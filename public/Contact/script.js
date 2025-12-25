// Initialize EmailJS with your user ID
emailjs.init('dubeytech9619@gmail.com');

// Get the form element
const form = document.querySelector('.pdf');

// Handle form submission
form.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Send email
    emailjs.sendForm('dubeytech9619@gmail.com', 'your_template_id', form)
        .then(function(response) {
            alert('Message sent successfully!');
            form.reset(); // Reset form after successful submission
        }, function(error) {
            alert('Failed to send message: ' + JSON.stringify(error));
        });
});
