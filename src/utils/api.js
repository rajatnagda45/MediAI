import axios from 'axios';

const API_URL = 'http://localhost:5005/api';

export const analyzeSymptoms = async (patientData) => {
  try {
    const response = await axios.post(`${API_URL}/ai/analyze`, patientData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const registerPatient = async (patientData) => {
  try {
    const response = await axios.post(`${API_URL}/patients/register`, patientData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
