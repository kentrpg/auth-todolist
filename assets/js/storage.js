const Storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
      return null;
    }
  },

  set(key, value) {
    try {
      const item = JSON.stringify(value);
      localStorage.setItem(key, item);
    } catch (error) {
      console.error('Error setting item in localStorage:', error);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
    }
  },

  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

export default Storage;