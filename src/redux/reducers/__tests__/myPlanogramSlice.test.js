import reducer, {
  setViewMode,
  setSearchTerm,
  setSelectedPlanogramIds,
  resetMyPlanogram,
} from '../myPlanogramSlice';

describe('myPlanogramSlice', () => {
  const initialState = {
    viewMode: "list",
    searchTerm: "",
    selectedPlanogramIds: [],
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

  describe('setSelectedPlanogramIds', () => {
    it('should set selected planogram IDs', () => {
      const ids = ['id1', 'id2', 'id3'];
      const action = setSelectedPlanogramIds(ids);
      const state = reducer(initialState, action);
      expect(state.selectedPlanogramIds).toEqual(ids);
    });

    it('should handle empty array', () => {
      const action = setSelectedPlanogramIds([]);
      const state = reducer(initialState, action);
      expect(state.selectedPlanogramIds).toEqual([]);
    });
  });

  describe('resetMyPlanogram', () => {
    it('should reset to initial state', () => {
      let state = reducer(initialState, setViewMode('grid'));
      state = reducer(state, setSearchTerm('test'));
      state = reducer(state, setSelectedPlanogramIds(['id1', 'id2']));
      
      const action = resetMyPlanogram();
      state = reducer(state, action);
      
      expect(state.viewMode).toBe('list');
      expect(state.searchTerm).toBe('');
      expect(state.selectedPlanogramIds).toEqual([]);
    });
  });
});

