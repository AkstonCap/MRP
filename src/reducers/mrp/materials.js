import * as TYPE from 'actions/types';

const initialState = [];

export default function materials(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_MATERIALS:
      return action.payload;

    case TYPE.ADD_MATERIAL:
      return [...state, action.payload];

    case TYPE.UPDATE_MATERIAL:
      return state.map(material =>
        material.id === action.payload.materialId
          ? { ...material, ...action.payload.updates }
          : material
      );

    case TYPE.DELETE_MATERIAL:
      return state.filter(material => material.id !== action.payload);

    default:
      return state;
  }
}
