import { BrowserRouter } from "react-router-dom";
import MainRoute from "../src/routes/MainRoute";

import { RouteChangeLoader } from "./components/common/RouteChangeLoader";

function App() {
  return (
    <BrowserRouter>
      <RouteChangeLoader />
      <MainRoute />
    </BrowserRouter>
  );
}

export default App;