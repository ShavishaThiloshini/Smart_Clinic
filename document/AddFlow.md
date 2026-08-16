

# Smart Clinic & Doctor Appointment System
# App Flow Document

## 1. Overview

This document describes how users navigate through the Smart Clinic &
Doctor Appointment System.

The application has three main user roles:

- Patient
- Doctor
- Administrator

---

# 2. Main Application Flow

```text
START
  |
  v
Landing Page
  |
  +------------------+
  |                  |
  v                  v
Register            Login
  |                  |
  +--------+---------+
           |
           v
     Role Detection
           |
     +-----+-----+
     |     |     |
     v     v     v
 Patient Doctor Admin
 Dashboard Dashboard Dashboard

 # 3. Patient Flow

 Landing Page
     |
     v
Register / Login
     |
     v
Patient Dashboard
     |
     +-------------------+
     |                   |
     v                   v
Find Doctor        My Appointments
     |
     v
Search Doctor
     |
     v
Filter Doctors
     |
     v
Doctor Profile
     |
     v
View Availability
     |
     v
Select Date
     |
     v
Select Time Slot
     |
     v
Confirm Appointment
     |
     v
Appointment Created
     |
     v
Appointment Status
     |
     +-----------------------+
     |                       |
     v                       v
Upcoming Appointment    Appointment History
     |
     v
Consultation
     |
     +------------------+
     |                  |
     v                  v
Medical Record     Prescription
     |
     v
Appointment Completed
     |
     v
Review & Rating

# 4. Doctor Flow

Login
  |
  v
Doctor Dashboard
  |
  +---------------------------+
  |                           |
  v                           v
Manage Profile          Manage Availability
                              |
                              v
                       Available Time Slots
                              |
                              v
                       View Appointments
                              |
                              v
                       Appointment Status
                              |
                              v
                         Consultation
                              |
                 +------------+------------+
                 |                         |
                 v                         v
          Medical Record             Prescription
                 |                         |
                 +------------+------------+
                              |
                              v
                    Complete Appointment

# 5. Administrator Flow

Login
  |
  v
Admin Dashboard
  |
  +--------------------+
  |                    |
  v                    v
Manage Users      Manage Doctors
  |                    |
  v                    v
Patients           Doctor Approval
                       |
                       v
              Manage Specializations
                       |
                       v
                 Manage Clinics
                       |
                       v
                 Manage Schedules
                       |
                       v
               Monitor Appointments
                       |
                       v
                 Manage Reviews
                       |
                       v
                    Reports
                       |
                       v
                 System Activity

# 6. Authentication Flow

User
 |
 v
Login Page
 |
 v
Enter Email + Password
 |
 v
Submit
 |
 v
Validate Credentials
 |
 +----------------------+
 |                      |
 v                      v
Invalid                Valid
 |                      |
 v                      v
Show Error         Generate Session/JWT
                       |
                       v
                 Identify User Role
                       |
             +---------+---------+
             |         |         |
             v         v         v
          Patient    Doctor     Admin
             |         |         |
             v         v         v
        Dashboard Dashboard Dashboard

7. Doctor Search Flow

Patient Dashboard
       |
       v
Search Doctor
       |
       v
Enter Doctor Name
OR
Select Specialization
       |
       v
Apply Availability Filter
       |
       v
Display Doctor Results
       |
       v
Select Doctor
       |
       v
Doctor Profile
       |
       v
View Available Slots

# 8. Appointment Booking Flow

Doctor Profile
      |
      v
Available Slots
      |
      v
Select Date
      |
      v
Select Time
      |
      v
Check Availability
      |
   +--+--+
   |     |
  NO    YES
   |     |
   v     v
Choose  Continue
another   |
slot      v
       Confirm Booking
           |
           v
       Create Appointment
           |
           v
        Pending
           |
           v
       Confirmation
           |
           v
       Notification

# 9. Appointment Status Flow

Pending
   |
   v
Confirmed
   |
   v
Consultation
   |
   +----------+----------+
   |                     |
   v                     v
Completed             No-show
   |
   v
Medical Record
   |
   v
Prescription
   |
   v
Review

# 10. Medical Record Flow 

Doctor
  |
  v
View Appointment
  |
  v
Consult Patient
  |
  v
Create Medical Record
  |
  v
Save Record
  |
  v
Associate with Patient
  |
  v
Associate with Appointment
  |
  v
Patient Can View Permitted Record

# 11. Prescription Flow

Completed Consultation
       |
       v
Doctor Creates Prescription
       |
       v
Add Medicine
       |
       v
Add Dosage
       |
       v
Add Frequency
       |
       v
Add Duration
       |
       v
Save Prescription
       |
       v
Patient Can View Prescription

# 12. Review Flow

Appointment
     |
     v
Completed?
     |
  +--+--+
  |     |
 NO    YES
  |     |
  v     v
No     Allow Review
Review     |
           v
      Rating + Comment
           |
           v
       Submit Review
           |
           v
    Admin Moderation


# 13. logout Flow

User Dashboard
      |
      v
Click Logout
      |
      v
Clear Session/JWT
      |
      v
Return to Login/Landing Page