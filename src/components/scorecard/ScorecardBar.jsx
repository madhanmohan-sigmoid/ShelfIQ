import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectSelectedTab, setSelectedTab } from '../../redux/reducers/scorecardSlice';

const ScorecardBar = () => {
  const activeTab = useSelector(selectSelectedTab);
  const dispatch = useDispatch();

  const onTabChange = (tabId) => {
    dispatch(setSelectedTab(tabId));
  }
  const tabs = [
    { id: 'cluster', label: 'Cluster Summary' },
    { id: 'subcategory', label: 'Sub-Category Overview' },
    { id: 'brand', label: 'Brand Overview' },
  ];
  return (

    <div className="py-4 w-full">
          <div className="flex items-center justify-center gap-x-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors duration-200 ${activeTab === tab.id
                    ? 'bg-[#3774B1] text-white'
                    : 'text-black hover:text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
  );
};

export default ScorecardBar;

