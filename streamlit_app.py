import streamlit as st

st.title('Check News Plagiarism')

@st.dialog('Ghanaweb')
def ghanaweb_form():
  gw_start_date = st.date_input('Start date')
  gw_end_date = st.date_input('End date')
  gw_num = st.text_input('Enter number')
  if st.button('Submit'):
    st.session_state.gw_response = {'start_date': gw_start_date,
                                    'end_date': gw_end_date,
                                    'gw_num': gw_num,
                                   }


@st.dialog('Joy News Online')
def joynews_form():
  jn_start_date = st.date_input('Start date')
  jn_end_date = st.date_input('End date')
  jn_num = st.text_input('Enter number')
  if st.button('Submit'):
    st.session_state.jn_response = {'start_date': jn_start_date,
                                    'end_date': jn_end_date,
                                    'jn_num': jn_num,
                                   }

col1, col2 = st.columns(2)
with col1:
  gw_button = st.button('Ghanaweb')
  if gw_button:
    gw_num = ghanaweb_form()
    
with col2:
  jn_button = st.button('Joy News')
  if jn_button:
    jn_num = joynews_form()

if 'gw_response' in st.session_state and 'jn_response' in st.session_state:
  st.write(int(gw_num) + int(jn_num))
