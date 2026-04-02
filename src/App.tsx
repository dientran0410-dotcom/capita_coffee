import { BrowserRouter } from "react-router-dom";
import MainRoute from "@/routes/MainRoute";

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