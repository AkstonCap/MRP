import { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from '@emotion/styled';
import { 
  Panel, 
  Button, 
  TextField,
  Table,
  showSuccessDialog,
  showErrorDialog,
  apiCall,
} from 'nexus-module';

import SupplyChainTracking from './SupplyChainTracking';

const BlockchainContainer = styled.div({
  marginTop: '20px',
  padding: '15px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  backgroundColor: '#f9f9f9',
});

const FeatureCard = styled.div({
  padding: '15px',
  margin: '10px 0',
  border: '1px solid #ddd',
  borderRadius: '5px',
  backgroundColor: 'white',
});

export default function BlockchainFeatures() {
  const materials = useSelector(state => state.mrp.materials);
  const userStatus = useSelector(state => state.nexus.userStatus);
  
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [sharingPartner, setSharingPartner] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const publishMaterialToBlockchain = async () => {
    if (!selectedMaterial) {
      showErrorDialog({ message: 'Please select a material to publish' });
      return;
    }

    if (!userStatus) {
      showErrorDialog({ message: 'Please log in to Nexus Wallet first' });
      return;
    }

    const material = materials.find(m => m.id === selectedMaterial);
    if (!material) return;

    try {
      setIsPublishing(true);
      
      // In a real implementation, this would create an asset on the Nexus blockchain
      // For demo purposes, we'll simulate the API call
      const assetData = {
        name: `material_${material.name.toLowerCase().replace(/\s+/g, '_')}`,
        data: JSON.stringify({
          materialId: material.id,
          name: material.name,
          description: material.description,
          unit: material.unit,
          type: material.type,
          publishedAt: new Date().toISOString(),
          publisher: 'demo_user', // In real app, this would be the user's address
        }),
      };

      // Simulate blockchain asset creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showSuccessDialog({ 
        message: 'Material published to blockchain',
        note: `Material "${material.name}" has been registered as an asset on the Nexus blockchain. This creates a permanent, tamper-proof record that can be shared with business partners.`
      });
      
      setSelectedMaterial('');
    } catch (error) {
      showErrorDialog({
        message: 'Failed to publish material to blockchain',
        note: error?.message || 'Unknown error occurred'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const shareWithPartner = async () => {
    if (!selectedMaterial || !sharingPartner) {
      showErrorDialog({ message: 'Please select a material and enter partner address' });
      return;
    }

    const material = materials.find(m => m.id === selectedMaterial);
    if (!material) return;

    try {
      // Simulate sharing material data with business partner
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showSuccessDialog({
        message: 'Material data shared successfully',
        note: `Material "${material.name}" specifications have been shared with ${sharingPartner}. They can now use this as a common reference point for business transactions.`
      });
      
      setSharingPartner('');
      setSelectedMaterial('');
    } catch (error) {
      showErrorDialog({
        message: 'Failed to share material data',
        note: error?.message || 'Unknown error occurred'
      });
    }
  };

  return (
    <BlockchainContainer>
      <h3>🔗 Blockchain Integration Features</h3>
      
      <FeatureCard>
        <h4>Material Master Data Registry</h4>
        <p>
          Publish material specifications to the Nexus blockchain to create immutable, 
          globally accessible material master data that can serve as a common reference 
          point for B2B transactions.
        </p>
        
        <div style={{ marginTop: '15px' }}>
          <select 
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            style={{ padding: '8px', marginRight: '10px', width: '200px' }}
          >
            <option value="">Select Material to Publish</option>
            {materials.map(material => (
              <option key={material.id} value={material.id}>
                {material.name}
              </option>
            ))}
          </select>
          
          <Button 
            onClick={publishMaterialToBlockchain}
            disabled={isPublishing || !userStatus}
          >
            {isPublishing ? 'Publishing...' : 'Publish to Blockchain'}
          </Button>
        </div>
        
        {!userStatus && (
          <p style={{ color: 'orange', marginTop: '10px' }}>
            ⚠️ Please log in to Nexus Wallet to use blockchain features
          </p>
        )}
      </FeatureCard>

      <FeatureCard>
        <h4>B2B Material Data Sharing</h4>
        <p>
          Share standardized material specifications with business partners to ensure 
          consistency in procurement, quality control, and supply chain management.
        </p>
        
        <div style={{ marginTop: '15px' }}>
          <TextField
            label="Partner Address"
            value={sharingPartner}
            onChange={(e) => setSharingPartner(e.target.value)}
            placeholder="Enter Nexus address or business identifier"
            style={{ marginBottom: '10px', width: '300px' }}
          />
          
          <Button 
            onClick={shareWithPartner}
            disabled={!selectedMaterial || !sharingPartner}
          >
            Share Material Data
          </Button>
        </div>
      </FeatureCard>

      <FeatureCard>
        <h4>Supply Chain Transparency</h4>
        <p>
          Each material transaction and movement can be recorded on-chain, creating 
          an immutable audit trail for compliance, quality assurance, and supply chain transparency.
        </p>
        
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Track material origin and certifications</li>
          <li>Record quality test results</li>
          <li>Document custody transfers</li>
          <li>Maintain compliance records</li>
        </ul>
      </FeatureCard>

      <FeatureCard>
        <h4>Decentralized Procurement</h4>
        <p>
          Enable direct peer-to-peer procurement by publishing material requirements 
          and availability on-chain, reducing intermediaries and transaction costs.
        </p>
        
        <div style={{ marginTop: '10px' }}>
          <strong>Benefits:</strong>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Reduced procurement costs</li>
            <li>Faster supplier discovery</li>
            <li>Transparent pricing</li>
            <li>Automated contract execution</li>
          </ul>
        </div>
      </FeatureCard>

      <SupplyChainTracking />
    </BlockchainContainer>
  );
}
