import * as TYPE from 'actions/types';

const initialState = 'materials';

export default function activeTab(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_ACTIVE_TAB:
      return action.payload;

    default:
      return state;
  }
}
