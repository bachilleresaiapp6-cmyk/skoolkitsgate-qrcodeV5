# **App Name**: QR GATE Skool Kits

## Core Features:

- Role-Based Registration: Allow users to register under different roles (Admin, Teacher, Student, Tutor, Staff) with appropriate fields and validation. Store to Google Sheets.
- QR Code Generation: Automatically generate unique QR codes upon successful registration.  The QR code contains user's email, school ID, name, role, and a timestamp.
- Credential Download: After registration, provide a downloadable credential card containing the user's information and the generated QR code as PNG and/or PDF. Downloadable as a PDF or for Printing. UI should use the standard size of 85.6mm x 54mm
- Role-Based Dashboards: Automatically redirect users to their role-specific dashboard after login. Display data based on the user's role.
- QR Code Scanning: Implement a QR code scanner to record entry and exit times of users. Update the 'ASISTENCIAS' sheet in Google Sheets with the scanned data.
- Password Reset: Implement a password reset flow, using Google Apps Script backend to verify a code which is delivered to the user's email. Only allow three attempts.
- School ID Generator: Allow admins to generate a unique 'school id' to administer multiple schools. Validate to format 'ESC-XXXX'.

## Style Guidelines:

- Primary color: Saturated blue (#4285F4) to convey trust, security, and knowledge. 
- Background color: Light blue (#E3F2FD), subtly desaturated (20%) to complement the primary color without overwhelming the user.
- Accent color: Analogous blue-violet (#673AB7), but with increased brightness and saturation to contrast effectively against the background and primary color. Use for primary CTAs and important alerts.
- Headline Font: 'Space Grotesk', sans-serif, is used for the title and headers in larger font sizes, to impart a scientific, technological feel.
- Body Font: 'Inter', sans-serif, to make it readable on various screen sizes
- Code Font: 'Source Code Pro' for displaying code snippets.
- Use modern, flat icons to represent different user roles and actions.
- Implement a tab-based navigation system for easy access to different sections of the application (Registration, Login, Enrollment).
- Use subtle animations to improve user experience when redirecting post registration and upon form validation success.