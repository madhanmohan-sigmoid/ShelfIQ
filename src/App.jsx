import React, { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRouter from "./router/AppRouter";
import { useDispatch } from "react-redux";
import { setMasterData } from "./redux/reducers/dataTemplateSlice";
import { getMasterData, getProductData } from "./api/api";
import { setProducts } from "./redux/reducers/productDataSlice";

function App() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const getAllMasterData = async () => {
    try {
      const response = await getMasterData();
      const productData = await getProductData();
      dispatch(setMasterData(response.data.data));
      dispatch(setProducts(productData.data.data));
    } catch (error) {
      console.error("Failed to fetch master data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllMasterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {!loading && (
        <Router>
          <AppRouter />
        </Router>
      )}
    </>
  );
}

export default App;