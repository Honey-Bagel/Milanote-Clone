import React, { useState } from 'react';
import { TextField, Grid, IconButton } from '@mui/material';
import * as Icons from '@mui/icons-material';

const IconSearch = ({ onSelectIcon }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter icons based on the search term
  const filteredIcons = Object.keys(Icons).filter(iconName => 
    iconName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div>
      <TextField
        label="Search Icons"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <Grid container spacing={2} style={{ marginTop: '10px' }}>
        {filteredIcons.map(iconName => {
          const IconComponent = Icons[iconName];
          return (
            <Grid item key={iconName} xs={4} sm={2}>
              <IconButton onClick={() => onSelectIcon(iconName)}>
                <IconComponent />
              </IconButton>
            </Grid>
          );
        })}
      </Grid>
    </div>
  );
};

export default IconSearch;