import { Platform } from 'react-native';

const CONFIG = {
  API_URL: Platform.OS === 'web' ? 'http://localhost:8000' : 'http://192.168.1.33:8000',
};

export default CONFIG;
