import { jest } from '@jest/globals';
import axios from 'axios';

const mockedAxios = jest.fn(axios);

export default mockedAxios;
