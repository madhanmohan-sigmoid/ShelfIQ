/**
 * Test component to demonstrate the save functionality
 * This can be used to verify that the save payload is generated correctly
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { selectSavedPlanogramState } from '../redux/reducers/planogramVisualizerSlice';

const SaveTestComponent = () => {
  const savedState = useSelector(selectSavedPlanogramState);
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', margin: '10px' }}>
      <h3>Saved Planogram State</h3>
      <pre style={{ backgroundColor: 'white', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
        {JSON.stringify(savedState, null, 2)}
      </pre>
    </div>
  );
};

export default SaveTestComponent;
