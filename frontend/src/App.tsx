import { useState } from 'react';
import Login from '@/screens/Login';
import Dashboard from '@/screens/Dashboard';
import CreateProblem from '@/screens/CreateProblem';
import ProblemDashboard from '@/screens/ProblemDashboard';
import NotificationContainer from '@/components/ui/Notification';
import { useNotifications } from '@/hooks/useNotifications';
import { Customer, setSession, Problem } from '@/lib/api';

type Screen =
  | { name: 'login' }
  | { name: 'dashboard' }
  | { name: 'create' }
  | { name: 'problem'; problemNumber: string };

function App() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'login' });
  const notify = useNotifications();

  function handleAuth(c: Customer) {
    setCustomer(c);
    setScreen({ name: 'dashboard' });
  }

  function handleLogout() {
    setSession(null);
    setCustomer(null);
    setScreen({ name: 'login' });
  }

  function handleProblemCreated(problem: Problem) {
    setScreen({ name: 'problem', problemNumber: problem.problem_number });
  }

  function handleOpenProblem(problemNumber: string) {
    setScreen({ name: 'problem', problemNumber });
  }

  return (
    <>
      <NotificationContainer
        notifications={notify.notifications}
        onDismiss={notify.dismiss}
      />

      {screen.name === 'login' && (
        <Login onAuth={handleAuth} notify={notify} />
      )}

      {screen.name === 'dashboard' && customer && (
        <Dashboard
          customer={customer}
          notify={notify}
          onCreate={() => setScreen({ name: 'create' })}
          onOpenProblem={handleOpenProblem}
          onLogout={handleLogout}
        />
      )}

      {screen.name === 'create' && customer && (
        <CreateProblem
          mobile={customer.mobile}
          notify={notify}
          onBack={() => setScreen({ name: 'dashboard' })}
          onCreated={handleProblemCreated}
        />
      )}

      {screen.name === 'problem' && (
        <ProblemDashboard
          problemNumber={screen.problemNumber}
          notify={notify}
          onBack={() => setScreen({ name: 'dashboard' })}
        />
      )}
    </>
  );
}

export default App;
