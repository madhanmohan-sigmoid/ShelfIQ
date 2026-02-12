import reducer, {
  setViewMode,
  setSearchTerm,
  resetDashboard,
} from '../dashboardSlice';

describe('dashboardSlice', () => {
  const initialState = {
    viewMode: "list",
    searchTerm: "",
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setViewMode', () => {
    it('should set view mode', () => {
      const action = setViewMode('grid');
      const state = reducer(initialState, action);
      expect(state.viewMode).toBe('grid');
    });
  });

  describe('setSearchTerm', () => {
    it('should set search term', () => {
      const action = setSearchTerm('test search');
      const state = reducer(initialState, action);
      expect(state.searchTerm).toBe('test search');
    });
  });

  describe('resetDashboard', () => {
    it('should reset to initial state', () => {
      let state = reducer(initialState, setViewMode('grid'));
      state = reducer(state, setSearchTerm('test'));
      
      const action = resetDashboard();
      state = reducer(state, action);
      
      expect(state.viewMode).toBe('list');
      expect(state.searchTerm).toBe('');
    });
  });
});

