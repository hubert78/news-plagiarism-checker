import json
import random
from datetime import datetime, timedelta

articles = [
    # Story 1: Bank of Ghana Policy Rate Decision (Plagiarized across multiple portals)
    {
        "Source": "Ghanaweb",
        "Category": "business",
        "Date Posted": "2024-08-26",
        "Title": "Bank of Ghana maintains Monetary Policy Rate at 29% amid inflation concerns",
        "URL": "https://www.ghanaweb.com/GhanaHomePage/business/Bank-of-Ghana-maintains-Monetary-Policy-Rate-at-29-amid-inflation-concerns-1954321",
        "Content": "The Monetary Policy Committee of the Bank of Ghana has maintained the policy rate at 29 percent citing recent inflation pressures and exchange rate volatility. Governor of the Bank of Ghana, Dr. Ernest Addison, addressing journalists in Accra on Monday, stated that while headline inflation has declined from peak levels, the pace of disinflation has slowed down considerably. The committee observed that risks to the inflation outlook remain elevated, driven primarily by upward adjustments in utility tariffs and transportation costs. Dr. Addison emphasized that the central bank remains committed to steering inflation back towards the medium-term target band of 8 plus or minus 2 percent. Economic growth continues to show resilience, supported by the services and agriculture sectors, although fiscal consolidation under the International Monetary Fund program remains critical for macroeconomic stability."
    },
    {
        "Source": "3News",
        "Category": "business",
        "Date Posted": "2024-08-26",
        "Title": "BoG keeps monetary policy rate unchanged at 29% to anchor inflation expectations",
        "URL": "https://3news.com/business/bog-keeps-monetary-policy-rate-unchanged-at-29-percent/",
        "Content": "The Monetary Policy Committee of the Bank of Ghana has maintained the policy rate at 29 percent citing recent inflation pressures and exchange rate volatility. Governor of the Bank of Ghana, Dr Ernest Addison, addressing journalists in Accra on Monday, announced that while headline inflation has declined from peak levels, the pace of disinflation has slowed down considerably. The committee observed that risks to the inflation outlook remain elevated, driven primarily by upward adjustments in utility tariffs and transportation costs. Dr. Addison emphasized that the central bank remains committed to steering inflation back towards the medium-term target band of 8 plus or minus 2 percent. Economic growth continues to show resilience, supported by the services and agriculture sectors, while fiscal consolidation under the IMF program remains critical."
    },
    {
        "Source": "MyJoyOnline",
        "Category": "business",
        "Date Posted": "2024-08-26",
        "Title": "Central Bank holds policy rate at 29% as disinflation pace eases",
        "URL": "https://www.myjoyonline.com/business/central-bank-holds-policy-rate-at-29-percent-as-disinflation-pace-eases/",
        "Content": "The Monetary Policy Committee of the Bank of Ghana has maintained the policy rate at 29 percent citing recent inflation pressures and exchange rate volatility. Speaking at the 119th MPC press briefing in Accra, Bank of Ghana Governor Dr. Ernest Addison said that headline inflation has witnessed a slower rate of decline in recent months. The committee highlighted that risks to the inflation outlook are skewed to the upside, primarily due to recent adjustments in utility tariffs, transport fares, and petroleum prices. The Governor reiterated the central bank's unwavering stance to maintain a tight monetary policy posture until inflation firmly returns to the target band of 8±2 percent. Private sector credit growth remained subdued as commercial banks adopted cautious lending practices."
    },
    {
        "Source": "Modern Ghana",
        "Category": "business",
        "Date Posted": "2024-08-26",
        "Title": "Bank of Ghana retains policy rate at 29 percent",
        "URL": "https://www.modernghana.com/news/1334521/bank-of-ghana-retains-policy-rate-at-29-percent.html",
        "Content": "The Monetary Policy Committee of the Bank of Ghana has maintained the policy rate at 29 percent citing recent inflation pressures and exchange rate volatility. Governor of the Bank of Ghana, Dr. Ernest Addison, addressing journalists in Accra on Monday, stated that while headline inflation has declined from peak levels, the pace of disinflation has slowed down considerably. The committee observed that risks to the inflation outlook remain elevated, driven primarily by upward adjustments in utility tariffs and transportation costs. Dr. Addison emphasized that the central bank remains committed to steering inflation back towards the medium-term target band of 8 plus or minus 2 percent."
    },
    {
        "Source": "Yen Ghana",
        "Category": "Business",
        "Date Posted": "2024-08-26",
        "Title": "Bank of Ghana freezes policy rate at 29% for third consecutive time",
        "URL": "https://yen.com.gh/business-economy/264101-bank-ghana-freezes-policy-rate-29-percent/",
        "Content": "The Bank of Ghana has announced that its Monetary Policy Committee decided to hold the monetary policy rate steady at 29 percent. Governor Dr. Ernest Addison told reporters during a press conference in Accra that inflationary pressures and cedi depreciation were the primary factors behind the decision. He noted that although price growth slowed earlier in the year, recent energy tariff hikes and food supply constraints pose renewed risks. The central bank plans to keep monetary policy sufficiently restrictive to achieve price stability under Ghana's ongoing three-billion-dollar IMF bailout."
    },

    # Story 2: Black Stars AFCON Qualifiers Squad Announcement (Copied from GFA release)
    {
        "Source": "Ghanaweb",
        "Category": "SportsArchive",
        "Date Posted": "2024-08-27",
        "Title": "Otto Addo names 23-man Black Stars squad for Angola and Niger AFCON qualifiers",
        "URL": "https://www.ghanaweb.com/GhanaHomePage/SportsArchive/Otto-Addo-names-23-man-Black-Stars-squad-for-Angola-and-Niger-AFCON-qualifiers-1954489",
        "Content": "Head Coach of the Ghana national team, Otto Addo, has unveiled a 23-man squad for the upcoming 2025 Africa Cup of Nations qualifying matches against Angola and Niger. Captain Thomas Partey leads the squad, which also features West Ham United playmaker Mohammed Kudus and Athletic Bilbao forward Inaki Williams. Lawrence Ati Zigi retains his spot in goal alongside Joseph Wollacott and Frederick Asare. In defense, Tariq Lamptey, Alidu Seidu, Alexander Djiku, and Mohammed Salisu have all been handed call-ups. Otto Addo explained that the technical team selected in-form players capable of securing maximum points in Kumasi and Berkane. The Black Stars will open their qualifying campaign against Angola at the Baba Yara Sports Stadium on September 5."
    },
    {
        "Source": "3News",
        "Category": "sports",
        "Date Posted": "2024-08-27",
        "Title": "AFCON 2025 Qualifiers: Otto Addo announces 23-man Black Stars squad for Angola, Niger clashes",
        "URL": "https://3news.com/sports/afcon-2025-qualifiers-otto-addo-announces-23-man-black-stars-squad/",
        "Content": "Head Coach of the Ghana national team, Otto Addo, has unveiled a 23-man squad for the upcoming 2025 Africa Cup of Nations qualifying matches against Angola and Niger. Captain Thomas Partey leads the squad, which also features West Ham United playmaker Mohammed Kudus and Athletic Bilbao forward Inaki Williams. Lawrence Ati Zigi retains his spot in goal alongside Joseph Wollacott and Frederick Asare. In defense, Tariq Lamptey, Alidu Seidu, Alexander Djiku, and Mohammed Salisu have all been handed call-ups. Otto Addo explained that the technical team selected in-form players capable of securing maximum points in Kumasi and Berkane. The Black Stars will open their qualifying campaign against Angola at the Baba Yara Sports Stadium on September 5."
    },
    {
        "Source": "MyJoyOnline",
        "Category": "sports",
        "Date Posted": "2024-08-27",
        "Title": "Partey, Kudus, Inaki headline Otto Addo's 23-man squad for September AFCON qualifiers",
        "URL": "https://www.myjoyonline.com/sports/partey-kudus-inaki-headline-otto-addos-23-man-squad-for-afcon-qualifiers/",
        "Content": "Ghana Black Stars head coach Otto Addo has officially released a 23-man squad ahead of the 2025 Africa Cup of Nations qualifiers against Angola and Niger. Arsenal midfielder and team captain Thomas Partey headlines the roster alongside West Ham talisman Mohammed Kudus and Athletic Bilbao star Inaki Williams. The squad sees the return of Brighton defender Tariq Lamptey and Monaco defender Mohammed Salisu. Addressing the media at the GFA headquarters in Accra, Coach Addo expressed confidence in his team's preparedness to begin the qualification campaign on a winning note. The team will commence camping in Kumasi ahead of the match day one encounter at Baba Yara Stadium."
    },
    {
        "Source": "Modern Ghana",
        "Category": "sports",
        "Date Posted": "2024-08-27",
        "Title": "Otto Addo reveals 23-man squad for 2025 AFCON qualifiers against Angola and Niger",
        "URL": "https://www.modernghana.com/sports/1334650/otto-addo-reveals-23-man-squad-for-2025-afcon-qualifiers.html",
        "Content": "Head Coach of the Ghana national team, Otto Addo, has unveiled a 23-man squad for the upcoming 2025 Africa Cup of Nations qualifying matches against Angola and Niger. Captain Thomas Partey leads the squad, which also features West Ham United playmaker Mohammed Kudus and Athletic Bilbao forward Inaki Williams. Lawrence Ati Zigi retains his spot in goal alongside Joseph Wollacott and Frederick Asare. In defense, Tariq Lamptey, Alidu Seidu, Alexander Djiku, and Mohammed Salisu have all been handed call-ups."
    },
    {
        "Source": "Yen Ghana",
        "Category": "Sports",
        "Date Posted": "2024-08-27",
        "Title": "AFCON 2025 qualifiers: Kudus, Partey included in Otto Addo's 23-man squad",
        "URL": "https://yen.com.gh/sports/264150-afcon-2025-qualifiers-kudus-partey-included-otto-addo-squad/",
        "Content": "Black Stars trainer Otto Addo has called up 23 players for next month's 2025 Africa Cup of Nations qualifiers against Palancas Negras of Angola and Mena of Niger. Arsenal star Thomas Partey has been named captain of the side, while Mohammed Kudus of West Ham United and Inaki Williams of Athletic Club are expected to lead the attack. Local goalkeeper Frederick Asare of Asante Kotoko was also named in the squad list announced at the GFA Secretariat. The team will assemble in Kumasi on Monday for intensive training sessions."
    },

    # Story 3: Electoral Commission Voter Exhibition Exercise
    {
        "Source": "Ghanaweb",
        "Category": "NewsArchive",
        "Date Posted": "2024-08-25",
        "Title": "EC extends voter exhibition exercise by two days nationwide",
        "URL": "https://www.ghanaweb.com/GhanaHomePage/NewsArchive/EC-extends-voter-exhibition-exercise-by-two-days-nationwide-1954200",
        "Content": "The Electoral Commission of Ghana has announced a two-day extension of the nationwide voter exhibition exercise. The exercise, which was originally scheduled to end on Tuesday, August 27, will now conclude on Thursday, August 29, 2024. In a press statement signed by Deputy Chairman in charge of Operations, Samuel Tettey, the commission explained that the extension is intended to allow registered voters ample time to verify their details on the provisional voter register. The commission urged all eligible citizens who registered during the continuous registration exercise to visit their designated exhibition centers to correct errors in names, age, sex, or polling station allocations."
    },
    {
        "Source": "3News",
        "Category": "news",
        "Date Posted": "2024-08-25",
        "Title": "Electoral Commission extends voter register exhibition exercise to August 29",
        "URL": "https://3news.com/news/electoral-commission-extends-voter-register-exhibition-exercise/",
        "Content": "The Electoral Commission of Ghana has announced a two-day extension of the nationwide voter exhibition exercise. The exercise, which was originally scheduled to end on Tuesday, August 27, will now conclude on Thursday, August 29, 2024. In a press statement signed by Deputy Chairman in charge of Operations, Samuel Tettey, the commission explained that the extension is intended to allow registered voters ample time to verify their details on the provisional voter register. The commission urged all eligible citizens who registered during the continuous registration exercise to visit their designated exhibition centers to correct errors in names, age, sex, or polling station allocations."
    },
    {
        "Source": "MyJoyOnline",
        "Category": "news",
        "Date Posted": "2024-08-25",
        "Title": "EC grants 48-hour extension for voters register exhibition",
        "URL": "https://www.myjoyonline.com/news/ec-grants-48-hour-extension-for-voters-register-exhibition/",
        "Content": "The Electoral Commission has extended the ongoing exhibition of the provisional voters register by two additional days. According to a statement issued by the EC's Directorate of Electoral Services, the exercise will now end on Thursday, August 29, instead of the initial deadline of August 27. The electoral management body said the move followed requests from political parties and civil society organizations to ensure maximum participation of prospective voters before the December 7 general elections. Registered voters can check their details physically at polling centers or via the USSD shortcode *711*51#."
    },
    {
        "Source": "Modern Ghana",
        "Category": "news",
        "Date Posted": "2024-08-25",
        "Title": "Voters register exhibition extended by two days - EC announces",
        "URL": "https://www.modernghana.com/news/1334410/voters-register-exhibition-extended-by-two-days-ec-announces.html",
        "Content": "The Electoral Commission of Ghana has announced a two-day extension of the nationwide voter exhibition exercise. The exercise, which was originally scheduled to end on Tuesday, August 27, will now conclude on Thursday, August 29, 2024. In a press statement signed by Deputy Chairman in charge of Operations, Samuel Tettey, the commission explained that the extension is intended to allow registered voters ample time to verify their details on the provisional voter register."
    },
    {
        "Source": "Yen Ghana",
        "Category": "Politics",
        "Date Posted": "2024-08-25",
        "Title": "EC extends voter exhibition exercise nationwide by 48 hours",
        "URL": "https://yen.com.gh/politics/264020-ec-extends-voter-exhibition-exercise-nationwide-48-hours/",
        "Content": "The Electoral Commission has extended the 2024 voter register exhibition exercise by two days across all polling stations in Ghana. In an official release on Sunday, the EC stated that the exercise will now wrap up on Thursday, August 29. The electoral body encouraged all registered Ghanaians to take advantage of the additional window to verify their biographical data, check photographic clarity, and object to unqualified names on the register ahead of the December polls."
    },

    # Story 4: Parliament Anti-LGBT Bill Controversy & Supreme Court
    {
        "Source": "Ghanaweb",
        "Category": "NewsArchive",
        "Date Posted": "2024-08-24",
        "Title": "Supreme Court defers ruling on suits challenging Human Sexual Rights and Family Values Bill",
        "URL": "https://www.ghanaweb.com/GhanaHomePage/NewsArchive/Supreme-Court-defers-ruling-on-suits-challenging-Human-Sexual-Rights-Bill-1954098",
        "Content": "The Supreme Court of Ghana has deferred judgment on two injunction applications seeking to restrain Parliament and President Nana Addo Dankwa Akufo-Addo from transmitting and assenting to the Human Sexual Rights and Family Values Bill 2024. A seven-member panel presided over by Chief Justice Gertrude Torkornoo indicated that the court will deliver its ruling alongside the substantive constitutional suits challenging the legality of the bill. The plaintiffs, broadcast journalist Richard Dela Sky and researcher Dr. Amanda Odoi, contend that Parliament breached Article 108 of the 1992 Constitution regarding private members' bills imposing financial obligations on the consolidated fund. Speaker of Parliament Alban Bagbin, through his legal team, argued that the apex court lacks jurisdiction to halt legislative processes."
    },
    {
        "Source": "3News",
        "Category": "news",
        "Date Posted": "2024-08-24",
        "Title": "Apex Court defers ruling on injunction against transmission of Anti-LGBT Bill",
        "URL": "https://3news.com/news/apex-court-defers-ruling-on-injunction-against-anti-lgbt-bill/",
        "Content": "The Supreme Court of Ghana has deferred judgment on two injunction applications seeking to restrain Parliament and President Nana Addo Dankwa Akufo-Addo from transmitting and assenting to the Human Sexual Rights and Family Values Bill 2024. A seven-member panel presided over by Chief Justice Gertrude Torkornoo indicated that the court will deliver its ruling alongside the substantive constitutional suits challenging the legality of the bill. The plaintiffs, broadcast journalist Richard Dela Sky and researcher Dr. Amanda Odoi, contend that Parliament breached Article 108 of the 1992 Constitution regarding private members' bills imposing financial obligations on the consolidated fund. Speaker Alban Bagbin maintain the court cannot interfere in parliamentary autonomy."
    },
    {
        "Source": "MyJoyOnline",
        "Category": "news",
        "Date Posted": "2024-08-24",
        "Title": "Supreme Court puts on hold ruling on injunction against Anti-LGBT bill",
        "URL": "https://www.myjoyonline.com/news/supreme-court-puts-on-hold-ruling-on-injunction-against-anti-lgbt-bill/",
        "Content": "The Supreme Court has decided to put on hold its ruling on the interlocutory injunction applications against the anti-LGBT bill until the substantive constitutional matters are determined. Chief Justice Gertrude Torkornoo, leading a seven-member bench, ruled that hearing the interlocutory applications separately could prejudge the constitutional questions raised by the parties. Richard Dela Sky and Dr. Amanda Odoi are challenging the passage of the bill on constitutional grounds, citing financial implications on the public purse under Article 108. Counsel for Parliament opposed the application, asserting that judicial interference with the legislative arm undermines the separation of powers."
    },
    {
        "Source": "Modern Ghana",
        "Category": "news",
        "Date Posted": "2024-08-24",
        "Title": "Anti-LGBT Bill: Supreme Court postpones ruling on injunction applications",
        "URL": "https://www.modernghana.com/news/1334290/anti-lgbt-bill-supreme-court-postpones-ruling-on-injunction-applications.html",
        "Content": "The Supreme Court of Ghana has deferred judgment on two injunction applications seeking to restrain Parliament and President Nana Addo Dankwa Akufo-Addo from transmitting and assenting to the Human Sexual Rights and Family Values Bill 2024. A seven-member panel presided over by Chief Justice Gertrude Torkornoo indicated that the court will deliver its ruling alongside the substantive constitutional suits challenging the legality of the bill. The plaintiffs contend that Parliament breached Article 108 of the Constitution regarding private members' bills."
    },

    # Story 5: Entertainment - Stonebwoy wins Artiste of the Year at TGMA
    {
        "Source": "Ghanaweb",
        "Category": "entertainment",
        "Date Posted": "2024-08-23",
        "Title": "Stonebwoy crowned Artiste of the Year at Telecel Ghana Music Awards",
        "URL": "https://www.ghanaweb.com/GhanaHomePage/entertainment/Stonebwoy-crowned-Artiste-of-the-Year-at-Telecel-Ghana-Music-Awards-1953982",
        "Content": "Afro-dancehall superstar Stonebwoy won the coveted Artiste of the Year trophy at the 25th Telecel Ghana Music Awards held at the Grand Arena of the Accra International Conference Centre. The 'Into the Future' hitmaker bagged a total of six awards on the night, including Reggae/Dancehall Artiste of the Year, Songwriter of the Year, Record of the Year, and Album of the Year for his groundbreaking '5th Dimension' project. In his emotional acceptance speech, Stonebwoy dedicated the ultimate accolade to his late mother, Catherine Satekla, and appreciated his loyal Bhim Nation fanbase for their relentless support over the past decade."
    },
    {
        "Source": "3News",
        "Category": "showbiz",
        "Date Posted": "2024-08-23",
        "Title": "TGMA 2024: Stonebwoy adjudged Artiste of the Year, bags six prestigious honours",
        "URL": "https://3news.com/showbiz/tgma-2024-stonebwoy-adjudged-artiste-of-the-year/",
        "Content": "Afro-dancehall superstar Stonebwoy won the coveted Artiste of the Year trophy at the 25th Telecel Ghana Music Awards held at the Grand Arena of the Accra International Conference Centre. The 'Into the Future' hitmaker bagged a total of six awards on the night, including Reggae/Dancehall Artiste of the Year, Songwriter of the Year, Record of the Year, and Album of the Year for his groundbreaking '5th Dimension' project. In his emotional acceptance speech, Stonebwoy dedicated the ultimate accolade to his late mother, Catherine Satekla, and appreciated his loyal Bhim Nation fanbase for their relentless support over the past decade."
    },
    {
        "Source": "MyJoyOnline",
        "Category": "entertainment",
        "Date Posted": "2024-08-23",
        "Title": "Stonebwoy sweeps 6 awards including Artiste of the Year at 25th TGMA",
        "URL": "https://www.myjoyonline.com/entertainment/stonebwoy-sweeps-6-awards-including-artiste-of-the-year-at-tgma/",
        "Content": "Livingstone Etse Satekla, popularly known as Stonebwoy, cemented his legacy as a titan of Ghanaian music by sweeping six major awards at the silver jubilee edition of the Telecel Ghana Music Awards. The Def Jam recording artiste claimed the prestigious Artiste of the Year, beating stiff competition from Black Sherif, Sarkodie, King Promise, and Kuami Eugene. His critically acclaimed album '5th Dimension' took home Best Album, while his single 'Manodzi' featuring Angelique Kidjo secured Record of the Year and Best Songwriter honours. Stonebwoy expressed profound gratitude to God, his wife Dr. Louisa, and his fans."
    },
    {
        "Source": "Yen Ghana",
        "Category": "Entertanment",
        "Date Posted": "2024-08-23",
        "Title": "TGMA 2024: Stonebwoy wins Artiste of the Year, dedicates award to late mother",
        "URL": "https://yen.com.gh/entertainment/263910-tgma-2024-stonebwoy-wins-artiste-year-dedicates-award-late-mother/",
        "Content": "Ghanaian dancehall icon Stonebwoy walked away with the grand prize at the 2024 Telecel Ghana Music Awards, claiming the Artiste of the Year accolade. The musician received cheers from the audience as he took to the podium to collect his sixth trophy of the night. During his speech, Stonebwoy praised his team, his Bhim Nation fans, and paid tribute to his mother who passed away years ago. He also acknowledged his peers in the industry for raising the flag of Ghanaian music across the globe."
    },
    {
        "Source": "Modern Ghana",
        "Category": "entertainment",
        "Date Posted": "2024-08-23",
        "Title": "Stonebwoy named Artiste of the Year at 25th TGMA edition",
        "URL": "https://www.modernghana.com/entertainment/1334112/stonebwoy-named-artiste-of-the-year-at-25th-tgma.html",
        "Content": "Afro-dancehall superstar Stonebwoy won the coveted Artiste of the Year trophy at the 25th Telecel Ghana Music Awards held at the Grand Arena of the Accra International Conference Centre. The 'Into the Future' hitmaker bagged a total of six awards on the night, including Reggae/Dancehall Artiste of the Year, Songwriter of the Year, Record of the Year, and Album of the Year for his groundbreaking '5th Dimension' project."
    },

    # Story 6: Cocobod Cocoa Loan / Syndication Facility
    {
        "Source": "Ghanaweb",
        "Category": "business",
        "Date Posted": "2024-08-22",
        "Title": "Cocobod moves to self-finance cocoa purchases after 32 years of offshore syndication loans",
        "URL": "https://www.ghanaweb.com/GhanaHomePage/business/Cocobod-moves-to-self-finance-cocoa-purchases-after-32-years-1953810",
        "Content": "The Ghana Cocoa Board (COCOBOD) has announced a historic shift in its financing strategy, terminating its 32-year reliance on offshore syndicated loans to finance annual cocoa bean purchases. Chief Executive Officer of COCOBOD, Joseph Boahen Aidoo, told journalists in Accra that the board will instead adopt a domestic self-financing mechanism starting in the 2024/2025 crop season. Aidoo stated that high international interest rates and conditionalities on syndicated commercial loans had made offshore borrowing unsustainable for the cocoa sector. He emphasized that the new internal financing model will save Ghana over 150 million dollars in interest payments and financial transaction charges."
    },
    {
        "Source": "3News",
        "Category": "business",
        "Date Posted": "2024-08-22",
        "Title": "COCOBOD ditches offshore syndicated loan, moves to domestic self-financing model",
        "URL": "https://3news.com/business/cocobod-ditches-offshore-syndicated-loan-moves-to-domestic-model/",
        "Content": "The Ghana Cocoa Board (COCOBOD) has announced a historic shift in its financing strategy, terminating its 32-year reliance on offshore syndicated loans to finance annual cocoa bean purchases. Chief Executive Officer of COCOBOD, Joseph Boahen Aidoo, told journalists in Accra that the board will instead adopt a domestic self-financing mechanism starting in the 2024/2025 crop season. Aidoo stated that high international interest rates and conditionalities on syndicated commercial loans had made offshore borrowing unsustainable for the cocoa sector. He emphasized that the new internal financing model will save Ghana over 150 million dollars in interest payments."
    },
    {
        "Source": "MyJoyOnline",
        "Category": "business",
        "Date Posted": "2024-08-22",
        "Title": "COCOBOD to end offshore loan syndication after three decades",
        "URL": "https://www.myjoyonline.com/business/cocobod-to-end-offshore-loan-syndication-after-three-decades/",
        "Content": "In a major policy turn, COCOBOD has confirmed it will not seek an offshore syndicated loan for the 2024/2025 cocoa crop season, ending a financing model practiced since 1992. CEO Joseph Boahen Aidoo explained that soaring global borrowing costs and exchange rate volatility compelled the regulator to turn to domestic financing options. The agency plans to collaborate with local banks and international chocolate manufacturers for forward sales agreements to ensure timely payment to cocoa farmers across the country without incurring hefty interest burdens."
    },

    # Within-Source Duplicate content / URLs (Modern Ghana duplicates)
    {
        "Source": "Modern Ghana",
        "Category": "general",
        "Date Posted": "2024-08-26",
        "Title": "Bank of Ghana retains policy rate at 29 percent (Reprint)",
        "URL": "https://www.modernghana.com/news/1334521/bank-of-ghana-retains-policy-rate-at-29-percent.html",
        "Content": "The Monetary Policy Committee of the Bank of Ghana has maintained the policy rate at 29 percent citing recent inflation pressures and exchange rate volatility. Governor of the Bank of Ghana, Dr. Ernest Addison, addressing journalists in Accra on Monday, stated that while headline inflation has declined from peak levels, the pace of disinflation has slowed down considerably. The committee observed that risks to the inflation outlook remain elevated, driven primarily by upward adjustments in utility tariffs and transportation costs. Dr. Addison emphasized that the central bank remains committed to steering inflation back towards the medium-term target band of 8 plus or minus 2 percent."
    },
    {
        "Source": "Ghanaweb",
        "Category": "NewsArchive",
        "Date Posted": "2024-08-25",
        "Title": "EC extends voter exhibition exercise nationwide by 2 days",
        "URL": "https://www.ghanaweb.com/GhanaHomePage/NewsArchive/EC-extends-voter-exhibition-exercise-nationwide-by-2-days-1954201",
        "Content": "The Electoral Commission of Ghana has announced a two-day extension of the nationwide voter exhibition exercise. The exercise, which was originally scheduled to end on Tuesday, August 27, will now conclude on Thursday, August 29, 2024. In a press statement signed by Deputy Chairman in charge of Operations, Samuel Tettey, the commission explained that the extension is intended to allow registered voters ample time to verify their details on the provisional voter register. The commission urged all eligible citizens who registered during the continuous registration exercise to visit their designated exhibition centers to correct errors in names, age, sex, or polling station allocations."
    },

    # Story 8: Fuel Price Reductions (COPEC Press Release)
    {
        "Source": "Ghanaweb",
        "Category": "business",
        "Date Posted": "2024-08-18",
        "Title": "Fuel prices projected to fall by up to 4% in second pricing window of August - COPEC",
        "URL": "https://www.ghanaweb.com/GhanaHomePage/business/Fuel-prices-projected-to-fall-by-up-to-4-percent-COPEC-1953401",
        "Content": "The Chamber of Petroleum Consumers (COPEC) has projected a reduction in pump prices of petroleum products starting August 16 for the second pricing window. Executive Secretary of COPEC, Duncan Amoah, stated that the anticipated price reduction is attributable to relative stability in the foreign exchange market and a decline in international benchmark crude prices. Petrol prices are expected to drop from an average of 14.20 cedis to 13.80 cedis per litre, while diesel is expected to average 14.50 cedis per litre. COPEC urged Oil Marketing Companies (OMCs) to reflect the favorable international price changes at their retail pumps to give relief to transport operators and Ghanaian consumers."
    },
    {
        "Source": "3News",
        "Category": "business",
        "Date Posted": "2024-08-18",
        "Title": "COPEC projects up to 4% drop in fuel prices in second pricing window of August",
        "URL": "https://3news.com/business/copec-projects-up-to-4-percent-drop-in-fuel-prices/",
        "Content": "The Chamber of Petroleum Consumers (COPEC) has projected a reduction in pump prices of petroleum products starting August 16 for the second pricing window. Executive Secretary of COPEC, Duncan Amoah, stated that the anticipated price reduction is attributable to relative stability in the foreign exchange market and a decline in international benchmark crude prices. Petrol prices are expected to drop from an average of 14.20 cedis to 13.80 cedis per litre, while diesel is expected to average 14.50 cedis per litre. COPEC urged Oil Marketing Companies (OMCs) to reflect the favorable international price changes at their retail pumps to give relief to transport operators and Ghanaian consumers."
    },
    {
        "Source": "MyJoyOnline",
        "Category": "business",
        "Date Posted": "2024-08-18",
        "Title": "Fuel prices to drop by 3-4% from August 16 - COPEC",
        "URL": "https://www.myjoyonline.com/business/fuel-prices-to-drop-by-3-4-percent-copec/",
        "Content": "Consumers of petroleum products in Ghana could see a slight relief at the pumps as the Chamber of Petroleum Consumers predicts a 3 to 4 percent drop in petrol and diesel prices for the mid-August pricing window. In an advisory statement released by COPEC chief Duncan Amoah, the projected decline stems from a steadying cedi and slight dip in Brent crude benchmarks on global markets. Amoah called on the National Petroleum Authority to monitor OMCs to ensure price cuts are passed on to motorists."
    },
    {
        "Source": "Modern Ghana",
        "Category": "general",
        "Date Posted": "2024-08-18",
        "Title": "COPEC projects reduction in petroleum prices",
        "URL": "https://www.modernghana.com/news/1333700/copec-projects-reduction-in-petroleum-prices.html",
        "Content": "The Chamber of Petroleum Consumers (COPEC) has projected a reduction in pump prices of petroleum products starting August 16 for the second pricing window. Executive Secretary of COPEC, Duncan Amoah, stated that the anticipated price reduction is attributable to relative stability in the foreign exchange market and a decline in international benchmark crude prices. Petrol prices are expected to drop from an average of 14.20 cedis to 13.80 cedis per litre, while diesel is expected to average 14.50 cedis per litre."
    },
    {
        "Source": "Yen Ghana",
        "Category": "Business",
        "Date Posted": "2024-08-18",
        "Title": "Good news for drivers as COPEC announces upcoming reduction in petrol and diesel prices",
        "URL": "https://yen.com.gh/business-economy/263720-copec-announces-reduction-petrol-diesel-prices/",
        "Content": "Petroleum consumers in Ghana are set to enjoy lower fuel prices in the second half of August according to the Chamber of Petroleum Consumers. Duncan Amoah of COPEC explained that international crude price drops coupled with cedi performance will result in a 3 to 4 percent decrease in retail pump rates across the country."
    },

    # Story 9: Education / Free SHS review debate
    {
        "Source": "Ghanaweb",
        "Category": "NewsArchive",
        "Date Posted": "2024-08-17",
        "Title": "Education Minister rejects calls to review Free Senior High School policy funding model",
        "URL": "https://www.ghanaweb.com/GhanaHomePage/NewsArchive/Education-Minister-rejects-calls-to-review-Free-SHS-1953250",
        "Content": "Minister of Education, Dr. Yaw Osei Adutwum, has reaffirmed the government's commitment to fully funding the Free Senior High School (Free SHS) policy, dismissing calls from civil society and opposition figures to allow affluent parents to pay boarding fees. Speaking at the launch of the National STEM Education roadshow in Kumasi, Dr. Adutwum insisted that introducing cost-sharing would undermine equity and exclude vulnerable students from rural communities. He noted that secondary school enrollment has doubled since the policy's inception in 2017, with academic performance in WASSCE improving consistently across core subjects."
    },
    {
        "Source": "3News",
        "Category": "news",
        "Date Posted": "2024-08-17",
        "Title": "Govt won't allow cost-sharing in Free SHS - Dr. Adutwum insists",
        "URL": "https://3news.com/news/govt-wont-allow-cost-sharing-in-free-shs-adutwum/",
        "Content": "Minister of Education, Dr. Yaw Osei Adutwum, has reaffirmed the government's commitment to fully funding the Free Senior High School (Free SHS) policy, dismissing calls from civil society and opposition figures to allow affluent parents to pay boarding fees. Speaking at the launch of the National STEM Education roadshow in Kumasi, Dr. Adutwum insisted that introducing cost-sharing would undermine equity and exclude vulnerable students from rural communities. He noted that secondary school enrollment has doubled since the policy's inception in 2017, with academic performance in WASSCE improving consistently across core subjects."
    },
    {
        "Source": "MyJoyOnline",
        "Category": "news",
        "Date Posted": "2024-08-17",
        "Title": "Adutwum defends Free SHS implementation, rules out cost-sharing for parents",
        "URL": "https://www.myjoyonline.com/news/adutwum-defends-free-shs-rules-out-cost-sharing/",
        "Content": "Education Minister Dr Yaw Osei Adutwum has pushed back against demands to restructure the financing of the Free Senior High School flagship program. During a speech at Kumasi Technical University, the Minister argued that targeted fee-paying for boarding facilities would create social division in public high schools. He emphasized that government investments in modern science laboratories, textbooks, and teacher professional development are yielding positive educational outcomes."
    },
    {
        "Source": "Yen Ghana",
        "Category": "Ghana",
        "Date Posted": "2024-08-17",
        "Title": "No parent will pay boarding fees: Education Minister stands firm on Free SHS",
        "URL": "https://yen.com.gh/ghana/263650-education-minister-stands-firm-free-shs-boarding-fees/",
        "Content": "Dr. Yaw Osei Adutwum has insisted that the government will continue to bear the total cost of secondary education for all Ghanaian children under Free SHS. The Education Minister made the comments during an education forum in Ashanti Region, arguing that universal access must be protected to ensure inclusive national development."
    },

    # Story 10: Health - Mpox surveillance heightened at Kotoka International Airport
    {
        "Source": "Ghanaweb",
        "Category": "NewsArchive",
        "Date Posted": "2024-08-16",
        "Title": "Ghana Health Service heightens surveillance for Mpox at Kotoka International Airport and borders",
        "URL": "https://www.ghanaweb.com/GhanaHomePage/NewsArchive/GHS-heightens-surveillance-for-Mpox-at-KIA-1953100",
        "Content": "The Ghana Health Service (GHS) has intensified public health surveillance and screening protocols at Kotoka International Airport and all land border crossings following the World Health Organization's declaration of Mpox as a public health emergency of international concern. Director General of the GHS, Dr. Patrick Kuma-Aboagye, stated that port health officers have deployed thermal scanners and mandatory health declaration forms for arriving passengers from affected central and east African countries. Dr. Kuma-Aboagye assured the public that rapid diagnostic testing kits and isolation centers at Ga East Municipal Hospital and Ridge Hospital are fully operational."
    },
    {
        "Source": "3News",
        "Category": "health",
        "Date Posted": "2024-08-16",
        "Title": "Mpox Alert: GHS activates screening protocols at Kotoka Airport and entry points",
        "URL": "https://3news.com/health/mpox-alert-ghs-activates-screening-protocols-at-kotoka-airport/",
        "Content": "The Ghana Health Service (GHS) has intensified public health surveillance and screening protocols at Kotoka International Airport and all land border crossings following the World Health Organization's declaration of Mpox as a public health emergency of international concern. Director General of the GHS, Dr. Patrick Kuma-Aboagye, stated that port health officers have deployed thermal scanners and mandatory health declaration forms for arriving passengers from affected central and east African countries. Dr. Kuma-Aboagye assured the public that rapid diagnostic testing kits and isolation centers at Ga East Municipal Hospital and Ridge Hospital are fully operational."
    },
    {
        "Source": "MyJoyOnline",
        "Category": "news",
        "Date Posted": "2024-08-16",
        "Title": "Ghana on red alert over Mpox; GHS steps up border screening",
        "URL": "https://www.myjoyonline.com/news/ghana-on-red-alert-over-mpox-ghs-steps-up-border-screening/",
        "Content": "Following the WHO's global health emergency declaration on Mpox, the Ghana Health Service has activated its emergency response mechanisms across all points of entry. Dr. Patrick Kuma-Aboagye advised citizens to report rashes or fever symptoms to the nearest healthcare facility immediately, emphasizing that healthcare personnel have been trained in clinical case management and contact tracing."
    },
    {
        "Source": "Modern Ghana",
        "Category": "general",
        "Date Posted": "2024-08-16",
        "Title": "Mpox: Ghana Health Service steps up surveillance at borders",
        "URL": "https://www.modernghana.com/news/1333550/mpox-ghana-health-service-steps-up-surveillance.html",
        "Content": "The Ghana Health Service (GHS) has intensified public health surveillance and screening protocols at Kotoka International Airport and all land border crossings following the World Health Organization's declaration of Mpox as a public health emergency of international concern. Port health officers have deployed thermal scanners and mandatory health declaration forms for arriving passengers."
    },

    # Additional within-source duplicate content for 3News
    {
        "Source": "3News",
        "Category": "business",
        "Date Posted": "2024-08-26",
        "Title": "BoG maintains policy rate at 29 percent (Updated)",
        "URL": "https://3news.com/business/bog-keeps-monetary-policy-rate-unchanged-at-29-percent-update/",
        "Content": "The Monetary Policy Committee of the Bank of Ghana has maintained the policy rate at 29 percent citing recent inflation pressures and exchange rate volatility. Governor of the Bank of Ghana, Dr Ernest Addison, addressing journalists in Accra on Monday, announced that while headline inflation has declined from peak levels, the pace of disinflation has slowed down considerably. The committee observed that risks to the inflation outlook remain elevated, driven primarily by upward adjustments in utility tariffs and transportation costs."
    },

    # Additional within-source duplicate content for MyJoyOnline
    {
        "Source": "MyJoyOnline",
        "Category": "sports",
        "Date Posted": "2024-08-27",
        "Title": "Otto Addo names 23-man squad for 2025 AFCON qualifiers (Live Update)",
        "URL": "https://www.myjoyonline.com/sports/partey-kudus-inaki-headline-otto-addos-23-man-squad-for-afcon-qualifiers-duplicate/",
        "Content": "Ghana Black Stars head coach Otto Addo has officially released a 23-man squad ahead of the 2025 Africa Cup of Nations qualifiers against Angola and Niger. Arsenal midfielder and team captain Thomas Partey headlines the roster alongside West Ham talisman Mohammed Kudus and Athletic Bilbao star Inaki Williams. The squad sees the return of Brighton defender Tariq Lamptey and Monaco defender Mohammed Salisu. Addressing the media at the GFA headquarters in Accra, Coach Addo expressed confidence in his team's preparedness to begin the qualification campaign on a winning note."
    },

    # Additional duplicate URL test case for Yen Ghana
    {
        "Source": "Yen Ghana",
        "Category": "Business",
        "Date Posted": "2024-08-26",
        "Title": "Bank of Ghana freezes policy rate at 29% for third consecutive time",
        "URL": "https://yen.com.gh/business-economy/264101-bank-ghana-freezes-policy-rate-29-percent/",
        "Content": "The Bank of Ghana has announced that its Monetary Policy Committee decided to hold the monetary policy rate steady at 29 percent. Governor Dr. Ernest Addison told reporters during a press conference in Accra that inflationary pressures and cedi depreciation were the primary factors behind the decision. He noted that although price growth slowed earlier in the year, recent energy tariff hikes and food supply constraints pose renewed risks."
    },

    # Story 7: Distinct/Original Features (Low similarity stories to ensure realistic distribution)
    {
        "Source": "Ghanaweb",
        "Category": "features",
        "Date Posted": "2024-08-21",
        "Title": "Reviving the cocoa sector: The urgent need for irrigation and pest control",
        "URL": "https://www.ghanaweb.com/GhanaHomePage/features/Reviving-the-cocoa-sector-The-urgent-need-for-irrigation-1953600",
        "Content": "Ghana's cocoa sector has faced severe headwinds over the past few seasons, primarily due to illegal artisanal gold mining known as galamsey, the cocoa swollen shoot virus, and changing weather patterns. Agronomists across the Western and Ashanti regions have called on the government and private sector to implement subsidized drip irrigation facilities for smallholder farmers. By equipping farming communities with solar-powered boreholes, farmers can protect their pods during dry spells and double average tree yields without increasing chemical fertilizer application."
    },
    {
        "Source": "3News",
        "Category": "opinion",
        "Date Posted": "2024-08-21",
        "Title": "Navigating Ghana's energy transition: The role of natural gas and renewables",
        "URL": "https://3news.com/opinion/navigating-ghanas-energy-transition-opinion/",
        "Content": "As global economies pivot toward net-zero targets, Ghana must strategically leverage its offshore natural gas resources in the Tano basin as a transition fuel. While solar photovoltaic installations and mini-grids are expanding in rural savannah areas, heavy industrial manufacturing in Tema and Takoradi requires dependable baseload energy. Over-reliance on hydro from Akosombo and Kpong leaves the national grid exposed to seasonal drought risks. A hybrid approach balancing gas-fired thermal plants with solar parks represents Ghana's most pragmatic pathway."
    },
    {
        "Source": "MyJoyOnline",
        "Category": "opinion",
        "Date Posted": "2024-08-20",
        "Title": "Protecting digital consumers: Ghana's cybersecurity landscape in review",
        "URL": "https://www.myjoyonline.com/opinion/protecting-digital-consumers-ghana-cybersecurity-landscape/",
        "Content": "The rapid expansion of mobile money and fintech transactions in Ghana has revolutionized financial inclusion for millions of previously unbanked citizens. However, this growth has coincided with sophisticated social engineering scams and digital fraud schemes targeting unsuspecting users. The Cyber Security Authority must deepen collaboration with telecommunication network operators and commercial banks to implement biometric authentication protocols, stringent sim card verification, and public awareness campaigns."
    },
    {
        "Source": "Yen Ghana",
        "Category": "World",
        "Date Posted": "2024-08-20",
        "Title": "ECOWAS leaders convene extraordinary security summit in Abuja over regional stability",
        "URL": "https://yen.com.gh/world/263800-ecowas-leaders-convene-extraordinary-summit-abuja-security/",
        "Content": "Heads of State and Government of the Economic Community of West African States (ECOWAS) met in Abuja, Nigeria, for a high-level summit to address regional security and counter-terrorism cooperation. The summit, chaired by Nigerian President Bola Ahmed Tinubu, discussed the reintegration of Mali, Niger, and Burkina Faso following recent diplomatic tensions. Member states pledged financial commitments toward the ECOWAS standby force to enhance maritime safety in the Gulf of Guinea."
    },
    {
        "Source": "Modern Ghana",
        "Category": "general",
        "Date Posted": "2024-08-19",
        "Title": "Tema port container clearance: Shippers demand reduction in demurrage charges",
        "URL": "https://www.modernghana.com/news/1333900/tema-port-container-clearance-shippers-demand-reduction.html",
        "Content": "The Ghana Union of Traders Associations (GUTA) and the Importers and Exporters Association have renewed calls on the Ministry of Transport and the Ghana Ports and Harbours Authority (GPHA) to scrap weekend demurrage fees. Cargo owners lament that systemic delays in the Integrated Customs Management System (ICUMS) often prevent timely clearance of goods, causing exorbitant port rent and demurrage penalties. Freight forwarders have threatened strike actions if port concessionaires fail to address port congestion."
    }
]

# Write to data/articles.json
with open('data/articles.json', 'w', encoding='utf-8') as f:
    json.dump(articles, f, indent=2, ensure_ascii=False)

print(f"Generated {len(articles)} sample articles in data/articles.json")
