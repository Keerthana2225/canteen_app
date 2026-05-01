import { Platform } from 'react-native';

const CONFIG = {
  API_URL: Platform.OS === 'web' ? 'http://localhost:8000' : 'http://10.100.201.78:8000',
};

export default CONFIG;
