export function getPostLoginRoute(user) {
  return user?.isStaff ? '/admin-panel' : '/';
}
