// Generic ticket listener scaffold.
// This does not connect to a real ticketing system yet. Add ManageEngine/ServiceNow/Jira adapter later.

export async function fetchNewTicketsMock() {
  return [
    {
      id: 'mock-001',
      title: 'User cannot print',
      requester: 'Test User',
      description: 'Printer shows offline when user prints to HP-LaserJet-3rdFloor.',
      status: 'Open'
    }
  ];
}
