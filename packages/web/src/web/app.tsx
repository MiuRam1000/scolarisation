import { Route, Switch } from "wouter";
import Scolia from "./pages/scolia";
import { AuthScreen } from "./pages/scolia-auth";
import { Provider } from "./components/provider";
import { useSessionQuery } from "./queries/auth";
import { AgentFeedback } from "@runablehq/website-runtime";

function Shell() {
  const session = useSessionQuery();
  if (session.isLoading) {
    return (
      <div className="auth-loading" role="status">
        Chargement de votre espace…
      </div>
    );
  }
  if (!session.data) return <AuthScreen />;
  return (
    <Switch>
      <Route component={Scolia} />
    </Switch>
  );
}

function App() {
  return (
    <Provider>
      <Shell />
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
    </Provider>
  );
}

export default App;
