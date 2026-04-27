import { createBrowserRouter } from "react-router";
import LandingScreen from "./screens/LandingScreen";
import RoomLobbyScreen from "./screens/RoomLobbyScreen";
import GameScreen from "./screens/GameScreen";
import DhappaScreen from "./screens/DhappaScreen";
import RoundSummaryScreen from "./screens/RoundSummaryScreen";
import FinalResultsScreen from "./screens/FinalResultsScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingScreen,
  },
  {
    path: "/lobby/:roomCode",
    Component: RoomLobbyScreen,
  },
  {
    path: "/game/:roomCode",
    Component: GameScreen,
  },
  {
    path: "/dhappa/:roomCode",
    Component: DhappaScreen,
  },
  {
    path: "/summary/:roomCode",
    Component: RoundSummaryScreen,
  },
  {
    path: "/results/:roomCode",
    Component: FinalResultsScreen,
  },
]);
