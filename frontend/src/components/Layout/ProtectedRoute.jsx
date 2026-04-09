import { Navigate } from 'react-router-dom'
import PropTypes from 'prop-types'

export default function ProtectedRoute({ isLoggedIn, rolesAllowed, children }) {
  // Dummy user role, bisa diganti sesuai data user sebenarnya
  const userRole = localStorage.getItem("role") || "user"

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (!rolesAllowed.includes(userRole)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

ProtectedRoute.propTypes = {
  isLoggedIn: PropTypes.bool.isRequired,
  rolesAllowed: PropTypes.arrayOf(PropTypes.string).isRequired,
  children: PropTypes.node.isRequired,
}
