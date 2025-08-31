import { createSlice } from '@reduxjs/toolkit';

export const main = createSlice({
  name: 'main',
  initialState: {
    getMe: {},
    language: 'uz',
    login: false,
    getFilter: {},
    userType: '',
    accounts: {}
  },
  reducers: {
    setMe: (state, action) => {
      state.getMe = action.payload;
    },
    setAccounts: (state, action) => {
      state.accounts = action.payload;
    },
    setUserType: (state, action) => {
      state.userType = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setLogins: (state, action) => {
      state.login = action.payload;
    },
    setFilter: (state, action) => {
      state.getFilter = action.payload;
    },
  },
});
