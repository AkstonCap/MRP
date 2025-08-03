# MRP Module Icons

This folder contains custom SVG icons designed specifically for the Material Resource Planning (MRP) module.

## Icon Files

### `inventory.svg` (Currently Used)
- **Usage**: Main application icon for the MRP module
- **Design**: Stacked material boxes with a planning checklist
- **Represents**: Material inventory management and planning documentation
- **Features**: 
  - Inventory stacks showing different material quantities
  - Clipboard with checkmarks indicating organized workflow
  - Perfect for representing MRP core functionality

### `warehouse.svg`
- **Usage**: Alternative warehouse-focused icon
- **Design**: Warehouse building with inventory boxes inside
- **Represents**: Physical storage and warehouse management
- **Features**:
  - Warehouse structure with roof and doors
  - Internal inventory boxes
  - Windows showing activity
  - Suitable for logistics-focused MRP applications

### `mrp-flow.svg`
- **Usage**: Process flow and planning icon
- **Design**: Flowchart with connected process boxes
- **Represents**: MRP workflow and process management
- **Features**:
  - Connected process boxes showing material flow
  - Arrows indicating process direction
  - Icons in boxes representing different MRP functions
  - Ideal for planning and workflow visualization

## Usage in Code

Icons are referenced in the module using:
```javascript
icon={{ url: 'dist/icons/inventory.svg', id: 'mrp-icon' }}
```

## Design Principles

All icons follow these design principles:
- **24x24 viewBox** for consistency
- **CurrentColor** for theme compatibility
- **Scalable vector graphics** for crisp display at any size
- **Semantic meaning** clearly related to MRP functionality
- **Professional appearance** suitable for business applications

## Customization

To create additional icons or modify existing ones:
1. Maintain the 24x24 viewBox
2. Use `currentColor` for stroke and fill to support theming
3. Keep designs simple and clear at small sizes
4. Test icons in both light and dark themes
5. Follow the established visual language of the existing icons
