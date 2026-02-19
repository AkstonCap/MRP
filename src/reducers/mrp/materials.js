// Local materials store — kept as empty fallback for getAllMaterials().
// With the Layer 0 architecture, all materials come from Distordia masterdata
// on-chain.  The component library stores only asset addresses.
const initialState = [];

export default function materials(state = initialState) {
  return state;
}
