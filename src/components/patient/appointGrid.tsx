import AppointmentCard from "./appCards";
export default function AppointmentsGrid({
  appointments,
  activeTab,
  searchQuery,
  filterType,
}: any) {
  const filteredAppointments = appointments
    .filter((appointment: any) => {
      // Filter by tab
      if (activeTab === "upcoming") {
        return appointment.status === "confirmed" || appointment.status === "pending";
      } else if (activeTab === "past") {
        return appointment.status === "completed";
      } else if (activeTab === "cancelled") {
        return appointment.status === "cancelled";
      }
      return true;
    })
    .filter((appointment: any) => {
      // Filter by search query
      if (searchQuery) {
        return (
          appointment.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          appointment.specialty.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return true;
    })
    .filter((appointment: any) => {
      // Filter by type
      if (filterType !== "all") {
        return appointment.type === filterType;
      }
      return true;
    });

  if (filteredAppointments.length === 0) {
    return (
      <div className="text-center py-12 lg:py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          No appointments found
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {searchQuery
            ? "Try adjusting your search or filter to find what you're looking for."
            : "You don't have any appointments in this category yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {filteredAppointments.map((appointment: any) => (
        <AppointmentCard key={appointment.id} appointment={appointment} />
      ))}
    </div>
  );
}