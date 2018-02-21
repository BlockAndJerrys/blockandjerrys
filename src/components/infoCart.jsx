/*
   checkoutCart.js - displays the invoice -- both QR and copyable plaintext
   2018 Robert Durst
   https://github.com/robertDurst/blockandjerrys
*/

import React from 'react';
import { connect } from 'react-redux';
import {
  RaisedButton,
  Paper,
  TextField,
} from 'material-ui';
import {
  orange500,
} from 'material-ui/styles/colors';

const styles = {
  form: {
    display: 'flex',
    flexFlow: 'column nowrap',
  },
};

const InfoCart = ({ name, address, phone, handleInputChange, handleGenerate }) => (
  <Paper zDepth={3} style={styles.form}>
    <div style={{ padding: '0 1em' }}>
      <TextField
        floatingLabelText="Name"
        name="name"
        type="text"
        fullWidth
        value={name}
        onChange={handleInputChange}
      />
      <TextField
        hintText="Delivery address must be in the city of San Francisco."
        hintStyle={{ color: orange500 }}
        floatingLabelStyle={{ color: orange500 }}
        floatingLabelText="Delivery Address"
        name="address"
        type="text"
        rows={2}
        multiLine
        rowsMax={4}
        fullWidth
        value={address}
        onChange={handleInputChange}
      />
      <TextField
        floatingLabelText="Phone Number"
        name="phone"
        type="number"
        fullWidth
        value={phone}
        onChange={handleInputChange}
      />
    </div>

    <RaisedButton
      label="Request"
      secondary
      fullWidth
      /* disabled={!(this.state.name &&
        this.state.address &&
        this.state.phone.length >= 10
      )} */
      onClick={handleGenerate}
      style={{ marginTop: '1em' }}
    />
  </Paper>
);

const mapStateToProps = state => ({
  name: state.name,
  address: state.address,
  phone: state.phone,
});

const mapDispatchToProps = dispatch => ({
  handleGenerate: () => {
    dispatch({ type: 'GENERATE_INVOICE' });
  },
  handleInputChange: (event) => {
    dispatch({ type: 'INPUT_CHANGE', event });
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(InfoCart);
