import { useAuth } from '../context/AuthContext';
import HomePageGuest from '../pages/guest/HomePageGuest';
import HomePageCustomer from './customer/HomePageCustomer';

/**
 * MenuPage component that routes to the appropriate menu page based on authentication status
 * - If not authenticated: shows HomePageGuest
 * - If authenticated: shows HomePageCustomer
 */
const MenuPage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <HomePageCustomer />;
  }

  return <HomePageGuest />;
};

export default MenuPage;
