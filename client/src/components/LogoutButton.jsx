import { useAuth } from '../context/AuthContext';

const LogoutButton = () => {
    const { logout } = useAuth();
    const handeLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
        }
    }

    return (
        <button
            onClick={handeLogout}
            className='px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50'
        >
            Logout
        </button>
    )
}

export default LogoutButton;