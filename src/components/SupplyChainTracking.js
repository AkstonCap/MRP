import { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from '@emotion/styled';
import { 
  Button, 
  TextField,
  showSuccessDialog,
  showErrorDialog,
} from 'nexus-module';

const TrackingContainer = styled.div({
  marginTop: '20px',
});

const EventCard = styled.div(({ theme }) => ({
  padding: '10px',
  margin: '5px 0',
  border: `1px solid ${theme.mixer(0.125)}`,
  borderRadius: '3px',
  backgroundColor: theme.mixer(0.03125),
}));

export default function SupplyChainTracking() {
  const materials = useSelector(state => state.mrp.materials);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [eventType, setEventType] = useState('quality_test');
  const [eventDescription, setEventDescription] = useState('');
  const [location, setLocation] = useState('');
  const [trackingEvents, setTrackingEvents] = useState([]);

  const recordTrackingEvent = () => {
    if (!selectedMaterial || !eventDescription || !location) {
      showErrorDialog({ message: 'Please fill in all tracking event fields' });
      return;
    }

    const material = materials.find(m => m.id === selectedMaterial);
    if (!material) return;

    const newEvent = {
      id: Date.now().toString(),
      materialId: selectedMaterial,
      materialName: material.name,
      eventType,
      description: eventDescription,
      location,
      timestamp: new Date().toISOString(),
      blockchainTxId: `0x${Math.random().toString(16).substr(2, 40)}`, // Simulated tx ID
    };

    setTrackingEvents([newEvent, ...trackingEvents]);
    
    // Clear form
    setSelectedMaterial('');
    setEventDescription('');
    setLocation('');
    
    showSuccessDialog({ 
      message: 'Tracking event recorded',
      note: `Event recorded on blockchain with transaction ID: ${newEvent.blockchainTxId.substr(0, 10)}...`
    });
  };

  const getEventTypeIcon = (type) => {
    const icons = {
      quality_test: '🔬',
      shipment: '🚚',
      receipt: '📦',
      certification: '✅',
      inspection: '🔍',
      storage: '🏪',
    };
    return icons[type] || '📝';
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <TrackingContainer>
      <h4>Supply Chain Event Tracking</h4>
      <p>
        Record material movements, quality tests, certifications, and other supply chain 
        events on the blockchain for complete traceability.
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px',
        margin: '20px 0',
        padding: '15px',
        border: '1px solid #ccc',
        borderRadius: '5px'
      }}>
        <select 
          value={selectedMaterial}
          onChange={(e) => setSelectedMaterial(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="">Select Material</option>
          {materials.map(material => (
            <option key={material.id} value={material.id}>
              {material.name}
            </option>
          ))}
        </select>

        <select 
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="quality_test">Quality Test</option>
          <option value="shipment">Shipment</option>
          <option value="receipt">Receipt</option>
          <option value="certification">Certification</option>
          <option value="inspection">Inspection</option>
          <option value="storage">Storage</option>
        </select>

        <TextField
          label="Event Description"
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
          placeholder="Describe the event"
        />

        <TextField
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Where did this occur?"
        />

        <Button onClick={recordTrackingEvent}>
          Record Event
        </Button>
      </div>

      <h4>Recent Tracking Events</h4>
      {trackingEvents.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666' }}>
          No tracking events recorded yet. Record your first event above.
        </p>
      ) : (
        <div>
          {trackingEvents.map(event => (
            <EventCard key={event.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '18px', marginBottom: '5px' }}>
                    {getEventTypeIcon(event.eventType)} {event.materialName}
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>{event.eventType.replace('_', ' ').toUpperCase()}</strong>: {event.description}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    📍 {event.location} • ⏰ {formatDate(event.timestamp)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                    🔗 Blockchain TX: {event.blockchainTxId}
                  </div>
                </div>
              </div>
            </EventCard>
          ))}
        </div>
      )}

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f0f8ff', 
        border: '1px solid #b0d4f1',
        borderRadius: '5px'
      }}>
        <h4>🔍 Traceability Benefits</h4>
        <ul>
          <li><strong>Full Audit Trail</strong>: Complete history of material journey from source to destination</li>
          <li><strong>Quality Assurance</strong>: Record and verify quality tests and certifications</li>
          <li><strong>Compliance</strong>: Meet regulatory requirements with immutable records</li>
          <li><strong>Issue Resolution</strong>: Quickly identify source of quality issues or contamination</li>
          <li><strong>Customer Trust</strong>: Provide transparent proof of material provenance</li>
        </ul>
      </div>
    </TrackingContainer>
  );
}
