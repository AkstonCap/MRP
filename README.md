# MRP Module

This is a Nexus Wallet Module for Material Resource Planning (MRP) purposes built with React and Redux. It includes functionalities for managing products and product data as asset registers on the decentralised and public Nexus blockchain, as well as managing internal warehouse tracking, picking lists and automated bill of materials.

## Features

### 📋 Material Master Data Management
- Create and manage comprehensive material specifications
- Support for raw materials, semi-finished goods, and finished products
- Track material costs, units of measure, and descriptions
- Blockchain-based material registry for standardized B2B references

### 📦 Inventory Management
- Real-time inventory tracking with on-hand, reserved, and available quantities
- Transaction history for receipts, issues, and adjustments
- Inventory valuation and low-stock alerts
- Integration with procurement and production workflows

### 🔧 Bill of Materials (BOM)
- Define component relationships for manufactured items
- Multi-level BOM support for complex assemblies
- Quantity requirements per unit of production
- Cost rollup calculations for manufactured goods

### 🔗 Blockchain Integration
- **Material Master Registry**: Publish material specifications as immutable blockchain assets with standardized "distordia" status identifiers
- **Distordia Status System**: Standardized lifecycle management (1=Active, 2=Sold Out, 3=Planned, 4=Discontinued, 5=Pending Approval)
- **On-Chain Asset Querying**: Query and filter blockchain assets by distordia status using register/list/assets:asset API
- **B2B Data Sharing**: Share standardized material data with business partners using blockchain as common reference
- **Supply Chain Transparency**: Track material movements and certifications on-chain
- **Decentralized Procurement**: Enable direct peer-to-peer material sourcing through blockchain marketplace

### 💼 Business Benefits
- Reduce procurement costs through standardized material data with blockchain-based lifecycle management
- Improve supply chain transparency and compliance using distordia status tracking
- Enable direct B2B transactions without intermediaries through standardized asset identifiers
- Create immutable audit trails for quality assurance and regulatory compliance
- Facilitate collaborative supply chain management with shared material master data standards
- Filter and manage materials efficiently using the distordia status system (Active/Sold Out/Planned/etc.)


### How to test this module

1. Download and install the [latest version of Nexus Wallet](https://github.com/Nexusoft/NexusInterface/releases/latest) if you haven't.
2. Download [this template module's zip file](https://github.com/AkstonCap/MRP/releases/latest).
3. Open Nexus Wallet, go to Settings/Modules, drag and drop the zip file you've downloaded into the "Add module" section and click "Install module" when prompted.
4. After the wallet refreshes, an item for this template module will be added into the bottom navigation bar. Click on it to open the module.
