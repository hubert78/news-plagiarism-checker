import streamlit as st

st.title('Check News Plagiarism')

# Ghanaweb form
@st.dialog('Ghanaweb')
def ghanaweb_form():
    categories = ["NewsArchive", "business", "entertainment", "africa", "SportsArchive", "features"]
    gw_start_date = st.date_input('Start date')
    gw_end_date = st.date_input('End date')
    gw_categories = st.multiselect('Select news categories', categories)
    
    gw_num = st.text_input('Enter number')
    gw_submit = st.button('Submit')
    if gw_submit:
        st.session_state['gw_response'] = {'start_date': gw_start_date,
                                           'end_date': gw_end_date,
                                           'gw_categories': gw_categories,
                                           'gw_num': gw_num,
                                          }

# Joy News form
@st.dialog('Joy News')
def joynews_form():
    cat_news = ["national", "politics", "crime", "africa" "regional", "technology", "oddly-enough", "diaspora", "international", "health", "education", "obituary"]
    cat_business = ["economy", "energy", "finance", "investments", "mining", "agribusiness", "real-estate", "stocks", "telecom", "aviation", "banking", "technology-business"]
    cat_entertainment = ["movies", "music", "radio-tv", "stage", "art-design", "books"]
    cat_sports = ["football", "boxing", "athletics", "tennis", "golf", "other-sports"]
    cat_opinion = [""]
    
    
    jn_start_date = st.date_input('Start date')
    jn_end_date = st.date_input('End date')
    st.write('Select Categories')
    news = st.multiselect('Make a selection', cat_news)
    business = st.multiselect('Make a selection', cat_business)
    entertainment = st.multiselect('Make a selection', cat_entertainment)
    sports = st.multiselect('Make a selection', cat_sports)
    opinion = st.selectbox('Make a selection', opinion)
    
    jn_num = st.text_input('Enter number')
    jn_submit = st.button('Submit')
    if jn_submit:
        st.session_state['jn_response'] = {'start_date': jn_start_date,
                                           'end_date': jn_end_date,
                                           'jn_categories': {'news': news, 'business': business, 'entertainment': entertainment,
                                                             'sports': sports, 'opinion': opinion},
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

# Display results
if 'gw_response' in st.session_state and 'jn_response' in st.session_state:
    gw_num = st.session_state['gw_response']['gw_num']
    jn_num = st.session_state['jn_response']['jn_num']
    st.write(int(gw_num) + int(jn_num))
