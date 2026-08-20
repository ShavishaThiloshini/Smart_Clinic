import { useNavigate } from 'react-router-dom';

interface DoctorSearchCardProps {
  doctor: {
    doctorId: number;
    name: string;
    specialization: string | null;
    clinic: string | null;
    experience: number;
    consultationFee: number;
    rating: number;
    reviewCount: number;
  };
}

export function DoctorSearchCard({ doctor }: DoctorSearchCardProps) {
  const navigate = useNavigate();

  return (
    <div className="doctor-card">
      <div className="doctor-card-header">
        <div className="doctor-avatar">
          {/* Fallback to initial if no image */}
          {doctor.name ? doctor.name.charAt(0).toUpperCase() : 'D'}
        </div>
        <div className="doctor-info-basic">
          <h3 className="doctor-name">Dr. {doctor.name}</h3>
          <p className="doctor-specialty">{doctor.specialization || 'General Practitioner'}</p>
        </div>
      </div>
      
      <div className="doctor-card-body">
        <div className="doctor-stat">
          <span className="stat-label">Experience:</span>
          <span className="stat-value">{doctor.experience} Years</span>
        </div>
        <div className="doctor-stat">
          <span className="stat-label">Consultation:</span>
          <span className="stat-value">Rs. {doctor.consultationFee}</span>
        </div>
        <div className="doctor-stat">
          <span className="stat-label">Clinic:</span>
          <span className="stat-value">{doctor.clinic || 'N/A'}</span>
        </div>
        <div className="doctor-stat rating">
          <span className="stat-label">Rating:</span>
          <span className="stat-value">⭐ {doctor.rating} ({doctor.reviewCount})</span>
        </div>
      </div>
      
      <div className="doctor-card-footer">
        <button 
          className="btn-primary full-width"
          onClick={() => navigate(`/doctor/profile/${doctor.doctorId}`)}
        >
          View Profile
        </button>
      </div>
    </div>
  );
}
