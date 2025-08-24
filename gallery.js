// Get the current location from the page title
const titleParts = document.title.split(' ');
let currentLocation = '';
if (titleParts.length >= 4 && titleParts[1] === '-') {
    // Handle multi-word location names like "Sardar Samand" and "Shri Balaji"
    if (titleParts[2] === 'Sardar' && titleParts[3] === 'Samand') {
        currentLocation = 'sardar_samand';
    } else if (titleParts[2] === 'Shri' && titleParts[3] === 'Balaji') {
        currentLocation = 'shribalaji';
    } else {
        currentLocation = titleParts[2].toLowerCase();
    }
} else {
    currentLocation = titleParts[2] ? titleParts[2].toLowerCase() : '';
}

// Gallery items array
let galleryItems = [];
let currentIndex = 0;

// DOM Elements
const galleryGrid = document.getElementById('gallery-grid');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxVideo = document.getElementById('lightbox-video');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const closeButton = document.getElementById('lightbox-close');

// Load gallery items
async function loadGalleryItems() {
    try {
        let mediaFiles = [];

        switch (currentLocation) {
            case 'khejarala':
                mediaFiles = [   
                        { type: 'image', src: 'images/Khejarala/1.jpg', caption: 'Khejarla village (jodhpur) Map', size: 'big' },
                        { type: 'image', src: 'images/Khejarala/2.jpg', caption: 'Shree Rajendra bhakar (Agriculture Supervisor) showing the sites image of traditional water Bodies to Aadarsh singh (memb. Of Team RetroFlow)\nthat How he Try to  Revive Traditinal water Bodies with NGO\'s and Also by itself.', size: 'big' },
                        { type: 'image', src: 'images/Khejarala/3.jpg', caption: 'Team RETROFLOW and with Shree Muldan chaaran in Khejarla', size: 'big' },
                        { type: 'image', src: 'images/Khejarala/5.jpg', caption: 'This( Tanka) prenset in a Primary govt. School for Used in drinking and Other purpose  Tanka:used to store Rain water and underground water storage structure mainly found in Rajasthan arid region.\nSTRUCTURE: circular or square underground tank,plastered with lime or cement to prevent seepage.', size: 'big' },
                        { type: 'image', src: 'images/Khejarala/8.jpg', caption: 'Sujaan Sagar Talab its an ancient talab local people and other outsider also come to fill up water for drinking and used for irrigation  and its very helpful for animals during rainy season its totally filled with water .  \nTalab is a traditional water storage system commonly found in Rajasthan. These are man-made ponds or reservoirs used to store rainwater, especially in arid and semi-arid regions. Talabs play a crucial role in meeting the water needs of local communities for drinking, irrigation, and livestock. Often surrounded by ghats and steps, many talabs are centuries old and hold religious and cultural importance. Famous examples include Pichola Talab in Udaipur and Padamsar Talab in Jaisalmer. They showcase the wisdom of ancient water conservation techniques in a desert state like Rajasthan.', size: 'big' },
                        { type: 'image', src: 'images/Khejarala/10.jpg', caption: 'Government Handpump used for drinking water and other purposes in (khejarla) water available at 250-300 feet and its contain Floride and salinity which causes tooth decay and bone become weak and other problems', size: 'big' },
                        { type: 'image', src: 'images/Khejarala/11.jpg', caption: 'A canal is a man-made water channel used primarily for irrigation. It helps transport water from rivers, reservoirs, or dams to agricultural fields, enabling farmers to grow crops even during dry seasons. Canals play a crucial role in improving crop yield, supporting the rural economy and ensuring food security. In many Indian villages, canal systems are managed by government irrigation departments or local panchayats. They also help recharge groundwater levels and support nearby vegetation.', size: 'big' },
                        { type: 'image', src: 'images/Khejarala/13.jpg', caption: '(NADI)- its deep around 20-25 feet, this  is used to store rain water, drinking irrigation  and livestock during rainy season its totally filled  up to stairs , its is usually a shallow ,earthen depression designed to collect and store rainwater during the monsoon. Nadis are crucial for meeting the basic water needs of rural communities — including drinking water for humans and animals. Unlike talabs, nadis are smaller and often located on the outskirts of villages. They recharge groundwater and support local ecology.', size: 'big' },
                        { type: 'image', src: 'images/Khejarala/16.jpg', caption: 'Jinn ka bera(WELL):its an ancient well(100 -200year old) according to local mythology they said it was build by jinn ,in one night it just beside (NADI) its deep around according to local (25-30 feet. (WELL): Short Note on Well of Rajasthan (Structure & Depth Details):\nWells (Kuan or Beri) are traditional water sources in Rajasthan, widely used for accessing underground water, especially in areas with limited surface water. They are typically circular or square in shape and constructed using stone (Use for Drinking,irrigation and livestocks.', size: 'big' },
                        { type: 'image', src: 'images/Khejarala/18.jpg', caption: 'A cyclindrical tanka: A cylindrical tanka is a traditional underground rainwater harvesting structure used mainly in arid regions of Rajasthan. It is a circular, covered tank made of lime mortar, stone, or cement, designed to collect rainwater from rooftops or courtyards.', size: 'big' },
                        { type: 'image', src: 'images/Khejarala/4.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Khejarala/6.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Khejarala/7.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Khejarala/9.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Khejarala/12.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Khejarala/14.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Khejarala/15.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Khejarala/17.jpg', size: 'normal' },
                        { type: 'video', src: 'images/Khejarala/video1.mp4' },
                        { type: 'video', src: 'images/Khejarala/video2.mp4' },
                        { type: 'video', src: 'images/Khejarala/video3.mp4' },
                        { type: 'video', src: 'images/Khejarala/video4.mp4' },
                        { type: 'video', src: 'images/Khejarala/video5.mp4' },
                        { type: 'video', src: 'images/Khejarala/video6.mp4' },
                        { type: 'video', src: 'images/Khejarala/video7.mp4' },
                        { type: 'video', src: 'images/Khejarala/video8.mp4' }
                       ];
                break;
            case 'mandore':
                mediaFiles = [
                    { type: 'image', src: 'images/mandore/12.jpg', caption: 'NAGA NADI', size: 'big' },
                    { type: 'image', src: 'images/mandore/8.jpg', caption: 'Naganadi is an ancient canal (waterway) flowing through the Mandore Garden, which was earlier used for irrigation and enhancing the beauty of the garden.\nThis canal was built for water storage throughout the year and is a part of Mandore\'s water heritage.\nJodhpur Development Authority is working on a plan to redevelop this canal. It includes works like ghats, foot bridges and cleanliness\nIts aim is to re-establish it as a cultural site and tourist center.\n', size: 'big' },
                    { type: 'image', src: 'images/mandore/1.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/2.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/3.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/10.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/11.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/13.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/14.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/15.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/16.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/17.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/18.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/19.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/20.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/21.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/22.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/23.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/24.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/25.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/26.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mandore/27.jpg', size: 'normal' }
                ];
                break;
            case 'sangariya':
                mediaFiles = [
                    { type: 'image', src: 'images/Sangariya/1.jpg', caption: 'Unnamed Nadi of Sangariya, which was once a source of water for all daily chores, and today it is only for animals, because of urbanization, water supply to people is easy, and they get fresh, clean water instead of getting salty water from underground or well.', size: 'big' },
                    { type: 'image', src: 'images/Sangariya/18.jpg', caption: 'Sarpanch shares local insight, RetroFlow shares new ideas – collaboration begins here with JCKIC.', size: 'big' },
                    { type: 'image', src: 'images/Sangariya/2.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/10.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/11.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/12.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/13.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/14.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/15.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/16.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/17.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/19.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/20.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/21.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Sangariya/22.jpg', size: 'normal' }
                ];
                break;
            case 'salawas':
                mediaFiles = [
                        { type: 'image', src: 'images/Salawas/1.jpg', caption: 'THULAI NADI', size: 'big' },
                        { type: 'image', src: 'images/Salawas/2.jpg', caption: 'Thulai Nadi – Kishna Nagar (Salawas)-This over-100-year-old saline water Nadi served as a vital water source for Krishna Sarnagar\'s 17,000 residents. Historically, it supported drinking, domestic needs, irrigation, and cattle. It is spread over 15-20 bigha, and its source is water from Bhakar (Little Mountains). A well (Beri) lies at its centre, submerged during the rainy season when the Nadi fills completely. Its depth goes to 120-150 feet.', size: 'big' },
                        { type: 'image', src: 'images/Salawas/6.jpg', caption: 'RetroFlow team members conducted a detailed survey of Thulai Nadi along with local jan pratinidhi (public representatives), assessing its condition and community significance.', size: 'big' },
                        { type: 'image', src: 'images/Salawas/10.jpg', caption: 'Team on field work surveying the present condition of the traditional water bodies', size: 'big' },
                        { type: 'image', src: 'images/Salawas/16.jpg', caption: 'RetroFlow team interacting with the villagers through the public representatives & discussing the present water quality of Salawas.', size: 'big' },
                        { type: 'image', src: 'images/Salawas/17.jpg', caption: 'Discussed the water conservation initiatives by JCKIC, while Team RetroFlow shared insights on JCKIC features that can be adapted in the future to address local water challenges.', size: 'big' },
                        { type: 'image', src: 'images/Salawas/18.jpg', caption: 'Ghadai Nadi', size: 'big' },
                        { type: 'image', src: 'images/Salawas/19.jpg', caption: 'Well under Ghadai Nadi ', size: 'big' },
                        { type: 'image', src: 'images/Salawas/23.jpg', caption: 'Joon ki Bawadi is a historic stepwell, estimated to be over 200–400 years old, serving as a vital water source for the local community in earlier times. It holds cultural and spiritual significance, as it is maintained and watched over by Baba Bhairavji, a revered local guardian. Once known for its clean and deep water, the bawadi now faces severe pollution due to waste discharge from nearby steel industries in the Salawas area. This contamination has impacted its usability, turning a heritage water structure into an environmental concern.', size: 'big' },
                        { type: 'image', src: 'images/Salawas/25.jpg', caption: 'Baba Bhairavji expressed deep concern over the pollution of the once-sacred Jojari River, now contaminated by waste from nearby steel industries. He reflected on how time has changed everything—turning a pure lifeline into a polluted stream—urging the need to restore balance between progress and nature.', size: 'big' },
                        { type: 'image', src: 'images/Salawas/14.jpg', caption:  'Bera (well) in village family they used for their daily needs', size: 'big' },
                        { type: 'image', src: 'images/Salawas/3.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Salawas/4.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Salawas/5.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Salawas/7.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Salawas/8.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Salawas/9.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Salawas/11.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Salawas/12.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Salawas/13.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Salawas/15.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Salawas/20.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Salawas/21.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Salawas/22.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Salawas/24.jpg', size: 'normal' }
                         ];
                break;
            case 'osian':
                mediaFiles = [
                        { type: 'image', src: 'images/Osian/1.jpg', caption: 'In Osian, the Sarpanch and RetroFlow team discussed water issues and explored ideas to revive traditional bawdis from neglected dumping sites.', size: 'big' },
                        { type: 'image', src: 'images/Osian/2.jpg', caption: 'KATAN BAWARI', size: 'big' },
                        { type: 'image', src: 'images/Osian/13.jpg', caption: 'Built in the 10th century, Katan Bawadi is one of the lesser-known yet architecturally significant stepwells of Rajasthan.\nIts style is somewhat simpler compared to the grand Chand Baori of Abhaneri but still exhibits traditional Rajput and early medieval craftsmanship.\nIt served as a community water source, a place for cooling off in summer, and ritualistic or spiritual use, which is common for stepwells in desert regions.\nIt was once listed on the UNESCO World Heritage Tentative List under "Stepwells of India" in 2008, recognizing its cultural importance.', size: 'big' },
                        { type: 'image', src: 'images/Osian/19.jpg', caption: 'BADI NADI', size: 'big' },
                        { type: 'image', src: 'images/Osian/23.jpg', caption: 'This is the oldest Nadi in Osian Village, which was built a century ago and served as a community water source, performing Hindu rituals as well as used for spiritual purposes, but today this nadi is not clean due to things they use in performing rituals. It is called \'Badi Nadi\'\nBecause of the area it occupies, which should be a minimum of 1-2 Bigha, or length is about 200m, and the breadth is 50-60m.', size: 'big' },
                        { type: 'image', src: 'images/Osian/3.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/4.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/5.jpg', size: 'normal' }, 
                        { type: 'image', src: 'images/Osian/8.jpg', size: 'normal' }, 
                        { type: 'image', src: 'images/Osian/6.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/7.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/9.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/10.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/11.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/12.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/14.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/15.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/16.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/17.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/18.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/20.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/21.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/22.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/24.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/25.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/26.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/27.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/28.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/29.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/30.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/31.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/32.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/33.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/34.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/35.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/36.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/37.jpg', size: 'normal' },
                        { type: 'image', src: 'images/Osian/55.jpg', size: 'normal' }
                         ];
                break;
            case 'mathania':
                mediaFiles = [
                    { type: 'image', src: 'images/Mathania/1.jpg', caption: 'CHHOTI NADI-1:\nIt is a normal old Nadi which is regenerated by Sarpanch/Chairman of Mathania', size: 'big' },
                    { type: 'image', src: 'images/Mathania/2.jpg', caption: 'AABA NADA NADI-2 :\nAaba Nadi is another oldest Nadis of Mathania, regenerated under MNREGA, which was the largest Nadi of Mathania.', size: 'big' },
                    { type: 'image', src: 'images/Mathania/6.jpg', caption: 'CHHOTI BAWADI :\nThese are the oldest Bawadi\'s, as per information from the local people of Mathania, which was the source of water for the community in the earlier times, but after the pipelines were laid & as water level dropped too low, these were used as a Garbage dumping site.', size: 'big' },
                    { type: 'image', src: 'images/Mathania/11.jpg', caption: 'PURANA AYURVEDIC BAWADI', size: 'big' },
                    { type: 'image', src: 'images/Mathania/12.jpg', caption: 'Karni Mata Ji Temple-BAWADI', size: 'big' },
                    { type: 'image', src: 'images/Mathania/15.jpg', caption: 'HOUSE BUILT ON UNKNOWN BAWADI-1 :\nIn many Rajasthani towns, old bawris have been built over with houses and shops.\nAs stepwells dried up, people turned them into homes or commercial spaces.\nToday, many live or work above forgotten heritage structures.\nThis urban use hides history and risks damaging the original architecture.', size: 'big' },
                    { type: 'image', src: 'images/Mathania/16.jpg', caption: 'HOUSE BUILT ON UNKNOWN BAWADI-3', size: 'big' },
                    { type: 'image', src: 'images/Mathania/17.jpg', caption: 'HOUSE BUILT ON UNKNOWN BAWADI-2', size: 'big' },
                    { type: 'image', src: 'images/Mathania/18.jpg', caption: 'HOUSE BUILT ON UNKNOWN BAWADI-1', size: 'big' },
                    { type: 'image', src: 'images/Mathania/20.jpg', caption: 'HOUSE BUILT ON UNKNOWN BAWADI-3', size: 'big' },
                    { type: 'image', src: 'images/Mathania/21.jpg', caption: 'HOUSE BUILT ON UNKNOWN BAWADI-1', size: 'big' },
                    { type: 'image', src: 'images/Mathania/22.jpg', caption: 'HOUSE BUILT ON UNKNOWN BAWADI-1', size: 'big' },
                    { type: 'image', src: 'images/Mathania/26.jpg', caption: 'BERA-Jat Community:\nIn Mathanya village, the Bera once served as a key water source for the community.It provided drinking water and supported daily needs for years. With time, due to less rainfall and overuse, the water level declined.\nAs the Bera dried up, its importance gradually faded.People began using the space for waste dumping and neglect grew.\nA once vital lifeline turned into a forgotten, polluted site.', size: 'big' },
                    { type: 'image', src: 'images/Mathania/28.jpg', caption: 'BERA-Jat Community', size: 'big' },
                    { type: 'image', src: 'images/Mathania/30.jpg', caption: 'Rain water-Harvesting System', size: 'big' },
                    { type: 'image', src: 'images/Mathania/31.jpg', caption: 'In a powerful exchange of vision and values, the Sarpanch of Mathania shares deep insights on water problems and extinction traditional water bodies with Aditya Gautam(team leader) RetroFlow and Nishant Poddar— where grassroots experience meets youthful leadership.', size: 'big' },
                    { type: 'image', src: 'images/Mathania/3.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/10.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/13.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/14.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/19.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/23.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/24.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/25.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/27.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/29.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/32.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/33.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/34.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/35.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mathania/36.jpg', size: 'normal' }
                ];
                break;
            case 'sardar_samand':
                mediaFiles = [
                    { type: 'image', src: 'images/sardar_samand/1.jpg', caption: 'Panchayat Bhavan Sardar Samand', size: 'big' },
                    { type: 'image', src: 'images/sardar_samand/2.jpg', caption: 'Dimdi – The Dimdi is a traditional well built by Jabbar Singh, measuring around 10 to 20 feet deep. It draws water from an underground source and a nearby lake, making it a vital resource for irrigating village fields and supporting local agriculture. Over time, however, the water quality has declined due to pollution, putting both crops and community health at risk. Once a lifeline for farming, this well now urgently needs protection and restoration.', size: 'big' },
                    { type: 'image', src: 'images/sardar_samand/5.jpg', caption: 'Aditya Gautam engages in a focused discussion with the Secretary of Pali Sardar Samand\'s Sarpanch, addressing concerns over traditional water bodies and the growing challenges of water quality in the region. He also shares insights about JCKIC\'s mission to preserve and rejuvenate these vital water sources for sustainable rural development.', size: 'big' },
                    { type: 'image', src: 'images/sardar_samand/7.jpg', caption: 'SARDAR SAMAMD Lake : Sardar Samand Lake in Pali, Rajasthan, is an artificial lake built in 1902 by Maharaja Umaid Singh. It serves as a vital water source for nearby villages and supports local wildlife. Known for its scenic beauty and historic value, the lake now faces challenges like pollution and overuse.', size: 'big' },
                    { type: 'image', src: 'images/sardar_samand/9.jpg', caption: 'Pilli Nadi : Pili Nadi in Sardar Samand was once a key community water source, used daily for drinking, household needs, and cattle. It played a central role in the village\'s traditional water system. However, with urbanization and piped water supply, its use declined. Today, Peli Nadi remains as it is—largely unused but still holding cultural and ecological significance by providing water to cattle.', size: 'big' },
                    { type: 'image', src: 'images/sardar_samand/11.jpg', caption: 'Nishant Poddar member of RetrFlow draws a water sample from Pili Nala to assess its quality at JCKIC, IIT Jodhpur — a step toward understanding and preserving local water sources.', size: 'big' },
                    { type: 'image', src: 'images/sardar_samand/13.jpg', caption: 'Tinadi Bera : In Sardar Samandh, there exists an over 100-year-old Nadi built by Kishore Singh, a highly respected figure of the region. This traditional water source once used a bull-powered chakki (grinding wheel) to draw water, which was not only used for irrigation but also for grinding wheat into atta (flour). The system combined water extraction and food processing, reflecting the self-sustaining rural ingenuity of the time. Though largely forgotten today, it stands as a symbol of heritage and innovation rooted in the community\'s past.', size: 'big' },
                    { type: 'image', src: 'images/sardar_samand/16.jpg', caption: 'Atta Chakki', size: 'big' },
                    { type: 'image', src: 'images/sardar_samand/18.jpg', caption: 'In Sardar Samand Panchayat, Aditya Gautam(Team Leader of RetroFlow) engages in a thoughtful discussion with the Panchayat Secretary about the Beri present in the Nadi, while collecting water samples for analysis. The conversation also focused on the initiatives taken by JCKIC to preserve and rejuvenate traditional water bodies in the region.', size: 'big' },
                    { type: 'image', src: 'images/sardar_samand/22.jpg', caption: 'Team RetroFlow, representing JCKIC, held a discussion with the Sardar Samand Panchayat members and the Sarpanch on improving water quality and preservation of saline water, while proposing the installation of rainwater harvesting systems as a sustainable solution for the region\'s future.', size: 'big' },
                    { type: 'image', src: 'images/sardar_samand/20.jpg', caption: 'A beri (Well)  inside the centre of the Nadi known as Jodiya ke Nadi ,Depth - 30-40 feet', size : 'big' },
                    { type: 'image', src: 'images/sardar_samand/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/10.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/12.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/14.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/15.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/17.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/19.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/3.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/21.jpg', size: 'normal' }
                ];
                break;
            case 'pokhran':
                mediaFiles = [
                    { type: 'image', src: 'images/Pokhran/1.jpg', caption: 'Pokhran, in Jaisalmer, has long depended on traditional water bodies like tankas, kunds, and johads. Today, many are dried or neglected due to low rainfall and reliance on piped supply. However, revival efforts under MNREGA are helping restore these age-old systems for sustainable use.', size: 'big' },
                    { type: 'image', src: 'images/Pokhran/4.jpg', caption: 'Ramdevra Baori is a 663-year-old stepwell, with a groundwater level of around 150 feet. Though it still holds water, it is not used for drinking baori was converted into a temple, adding spiritual significance to its historical value. At present, the water is considered holy and medicinal, and locals believe it has healing properties, using it as a form of sacred remedy.', size: 'big' },
                    { type: 'image', src: 'images/Pokhran/2.jpg', caption: 'Ramdevra Sacred Water Source', size: 'big' },
                    { type: 'image', src: 'images/Pokhran/3.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Pokhran/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Pokhran/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Pokhran/7.jpg', size: 'normal' }
                ];
                break;
            case 'badabagh':
                mediaFiles = [
                    { type: 'image', src: 'images/Badabagh/1.jpg', caption: 'Badabagh in Jaisalmer faces acute water scarcity due to low rainfall and deep groundwater levels. The available water is in good condition for drinking purposes, as per locals. Surface water quickly evaporates under harsh sunlight, worsening the crisis. Sustainable solutions like rainwater harvesting and the revival of traditional sources are urgently needed.', size: 'big' },
                    { type: 'image', src: 'images/Badabagh/3.jpg', caption: 'In Badabagh, Jaisalmer, well water is used for irrigation and drinking, but manually drawing it is physically exhausting. As a result, locals rely on water tankers that bring water from submersible pumps. Though hundreds of wells exist in the area, most have dried up due to falling groundwater levels. This highlights the urgent need for sustainable and accessible water solutions in the region.Ancient Stepwell Architecture in Badabagh', size: 'big' },
                    { type: 'image', src: 'images/Badabagh/8.jpg', caption: 'KHITPAL NADI', size: 'big' },
                    { type: 'image', src: 'images/Badabagh/9.jpg',  caption: 'Khitpal Nadi is a traditional water body located in the Badabagh area of Jaisalmer, once serving as a major water source for local communities and their livestock. Based on rainwater harvesting, it also supported irrigation for nearby fields. Over time, due to a lack of maintenance, the Nadi is now drying up. The accumulation of waste and pollution has further made the water unfit for use, but used by cattles to drink water. Today, Khitpal Nadi stands in urgent need of revival and preservation to once again serve the needs of the region.',  size: 'big' ,},
                    { type: 'image', src: 'images/Badabagh/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Badabagh/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Badabagh/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Badabagh/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Badabagh/2.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Badabagh/10.jpg', size: 'normal' }
                ];
                break;
            case 'mokla':
                mediaFiles = [
                    { type: 'image', src: 'images/Mokla/1.jpg', caption: 'Mokla is a village located in the arid region of Jaisalmer, Rajasthan, where water scarcity is a significant challenge due to low rainfall and deep groundwater levels. The village relies heavily on traditional water bodies like Nadis and Beris, though many have dried up. Submersible pump systems and water tankers now serve as the secondary sources of drinking water. Despite its harsh conditions, Mokla holds a rich cultural heritage and offers great potential for reviving traditional water systems through sustainable efforts.', size: 'big' },
                    { type: 'image', src: 'images/Mokla/2.jpg', caption: 'In Mokla village, Jaisalmer, a Stambh (pillar or memorial) stands as a symbol of the community"traditional efforts to conserve water. It marks the historical site where Nadis (seasonal ponds) and other traditional water bodies were established to collect and store rainwater for drinking, daily use, and cattle. This Stambh not only honors the ancestors who initiated these systems but also serves as a reminder of the village’s water wisdom. Reviving these heritage structures today is key to tackling ongoing water scarcity.', size: 'big' },
                    { type: 'image', src: 'images/Mokla/5.jpg', caption: 'In Mokla village, Jaisalmer, only one existing talab (traditional pond) has been in use by the Oran community & whole village. That one Talab is the sole source of water for drinking and daily needs, making it vital for the village’s survival, which is present in the outer area of Mokla Village. And this is another Nadi revived by the water man of India and the Oran Community. To improve its capacity, the community is expanding the talab to store more rainwater. Despite their hard work, they have received no government support, and villagers express that government help exists only on paper, urging authorities to visit and witness the real situation on the ground.', size: 'big' },
                    { type: 'image', src: 'images/Mokla/7.jpg', caption : 'RetroFlow team members met with Mokla villagers, Oran leader Kundan Singh, and MGF India’s project in-charge Jitender Singh Shekhawat to understand efforts to revive the village’s only Nadi for drinking and daily water needs. The project is being funded by ₹5 lakhs from villagers and ₹15 lakhs from Tarun Bharat Sangh (TBS). Villagers strongly criticized government schemes, saying they don’t work in reality and that funds never reach the ground.' , size: 'big' },
                    { type: 'image', src: 'images/Mokla/3.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mokla/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mokla/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mokla/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mokla/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Mokla/10.jpg', size: 'normal' }
                ];
                break;
            case 'ramgarh':
                mediaFiles = [
                    { type: 'image', src: 'images/Ramgarh/1.jpg', caption: 'Ramgarh, Jaisalmer, faces water scarcity and groundwater issues. While the region once relied on Nadis, tankas, and wells, many are now neglected or dried up. With the arrival of pipeline water supply, the use of traditional sources has declined. However, local efforts are ongoing to revive and preserve these historic water bodies for future resilience.', size: 'big' },
                    { type: 'image', src: 'images/Ramgarh/3.jpg', caption: 'Kshatriyon Ki Nadi, a 100-year-old traditional water body, is maintained under MNREGA and holds deep local significance. Despite restoration efforts, it remains dry due to low rainfall, reflecting the growing impact of drought in the region.', size: 'big' },
                    { type: 'image', src: 'images/Ramgarh/7.jpg', caption:'Kshatriyon Ki Nadi-2' ,size: 'big' },
                    { type: 'image', src: 'images/Ramgarh/11.jpg', caption: 'The Ramgarh Panchayat members actively supported our documentation of traditional water bodies, sharing valuable local insights and guiding us to key sites, reflecting their strong commitment to preserving the region’s water heritage.',  size: 'big' },
                    { type: 'image', src: 'images/Ramgarh/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ramgarh/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ramgarh/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ramgarh/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ramgarh/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ramgarh/10.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ramgarh/12.jpg', size: 'normal' }
                ];
                break;
            case 'ranigaon':
                mediaFiles = [
                    { type: 'image', src: 'images/Ranigaon/1.jpg', caption: 'Ranigaon - Traditional Water Body', size: 'big' },
                    { type: 'image', src: 'images/Ranigaon/2.jpg', caption: 'Ancient Stepwell in Ranigaon', size: 'big' },
                    { type: 'image', src: 'images/Ranigaon/3.jpg', caption: 'Community Water Source in Ranigaon', size: 'big' },
                    { type: 'image', src: 'images/Ranigaon/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/10.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/11.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/12.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/13.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/14.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/15.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/16.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/17.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/18.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ranigaon/19.jpg', size: 'normal' }
                ];
                break;
            case 'ramderiya':
                mediaFiles = [
                    { type: 'image', src: 'images/Ramderiya/1.jpg', caption: 'Ramderiya - Traditional Water Conservation Site', size: 'big' },
                    { type: 'image', src: 'images/Ramderiya/2.jpg', caption: 'Ancient Stepwell in Ramderiya', size: 'big' },
                    { type: 'image', src: 'images/Ramderiya/3.jpg', caption: 'Community Water Source in Ramderiya', size: 'big' },
                    { type: 'image', src: 'images/Ramderiya/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ramderiya/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ramderiya/6.jpg', size: 'normal' }
                ];
                break;
            case 'siyai':
                mediaFiles = [
                    { type: 'image', src: 'images/Siyai/1.jpg', caption: 'Siyai - Traditional Water Body', size: 'big' },
                    { type: 'image', src: 'images/Siyai/2.jpg', caption: 'Ancient Stepwell in Siyai', size: 'big' }
                ];
                break;
            case 'ramsar':
                mediaFiles = [
                    { type: 'image', src: 'images/Ramsar/1.jpg', caption: 'Ramsar - Traditional Water Conservation Site', size: 'big' },
                    { type: 'image', src: 'images/Ramsar/2.jpg', caption: 'Ancient Stepwell in Ramsar', size: 'big' },
                    { type: 'image', src: 'images/Ramsar/3.jpg', caption: 'Community Water Source in Ramsar', size: 'big' },
                    { type: 'image', src: 'images/Ramsar/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ramsar/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ramsar/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ramsar/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Ramsar/8.jpg', size: 'normal' }
                ];
                break;
                case 'ratangarh' :
                mediaFiles = [
                    { name: '3.jpg', src: 'images/Ratangarh/3.jpg',size: 'big', caption: 'Visit Ratangarh for the traditional water body. We did not find old bawadis, and all that we found were ponds that were used to collect water for cattle. They get their supply of water from INGP (Indra Gandhi Canal Project) and other sources managed by PHED.' },
                    { name: '9.jpg', src: 'images/Ratangarh/9.jpg', size: 'big', caption: 'Team RetroFlow observed the magnificent structure of Sethani Ka Johar and actively engaged with residents to gather insights about its historical significance, water usage, and cultural importance in the Churu region.' },
                    { name: '10.jpg', src: 'images/Ratangarh/10.jpg', size: 'big', caption: 'Sethani Ka Johar, located in Churu, Rajasthan, is a historic water reservoir built in the late 19th century by a wealthy merchant’s wife during a devastating famine. Constructed to provide relief from water scarcity, this large johar (traditional reservoir) was designed to collect and store rainwater, serving the drinking, irrigation, and cattle needs of the community. Even today, it retains water after the monsoon and stands as a powerful symbol of philanthropy, traditional water wisdom, and community-led conservation in arid Rajasthan.' },
                    { name: '13.jpg', src: 'images/Ratangarh/13.jpg', size: 'big', caption: 'Sethani Ka Johar is a historic rainwater reservoir in Churu, built in the 19th century by a merchant’s wife during a famine. It features a large rectangular tank, stone staircases, ornate chhatris, and inlet channels for rainwater collection. This beautifully designed Johar remains a symbol of charity, heritage, and traditional water wisdom.' },
                    { name: '1.jpg',  src: 'images/Ratangarh/1.jpg', size: 'normal', caption: 'Ratangarh Heritage Site' },
                    { name: '2.jpg', src: 'images/Ratangarh/2.jpg',size: 'normal', caption: 'Cultural Heritage of Ratangarh' },
                    { name: '4.jpg', src: 'images/Ratangarh/4.jpg',size: 'normal', caption: 'Local Architecture' },
                    { name: '5.jpg', src: 'images/Ratangarh/5.jpg',size: 'normal', caption: 'Traditional Buildings' },
                    { name: '6.jpg', src: 'images/Ratangarh/6.jpg',size: 'normal', caption: 'Heritage Structures' },
                    { name: '7.jpg', src: 'images/Ratangarh/7.jpg',size: 'normal', caption: 'Cultural Landmarks' },
                    { name: '8.jpg', src: 'images/Ratangarh/8.jpg',size: 'normal', caption: 'Historical Sites' },
                    { name: '11.jpg', src: 'images/Ratangarh/11.jpg', size: 'normal', caption: 'Cultural Monuments' },
                    { name: '12.jpg', src: 'images/Ratangarh/12.jpg', size: 'normal', caption: 'Historical Landmarks' },
                    { name: '14.jpg', src: 'images/Ratangarh/14.jpg', size: 'normal', caption: 'Heritage Architecture' },
                    { name: '15.jpg', src: 'images/Ratangarh/15.jpg', size: 'normal', caption: 'Cultural Sites' },
                    { name: '16.jpg', src: 'images/Ratangarh/16.jpg', size: 'normal', caption: 'Historical Buildings' }
                ];
                break
            case 'gajsar':
                mediaFiles = [
                    { type: 'image', src: 'images/Gajsar/1.jpg', size: 'big', caption: 'Well' },
                    { type: 'image', src: 'images/Gajsar/3.jpg', size: 'big', caption: 'This historic well and collecting tank in Gajsar, Churu, once served as a lifeline for the village, providing water for daily use. Today, it lies neglected, turned into a garbage dumping site, losing its identity as a symbol of traditional rural water heritage. Its revival is essential for preserving both culture and community health.' },
                    { type: 'image', src: 'images/Gajsar/4.jpg', size: 'big', caption: 'This dome-shaped Kundi (traditional underground water tank) is located in Gajsar village, Churu, Rajasthan. Designed for rainwater harvesting, it features a plastered dome, catchment platform, and small steps for access. Such structures were crucial for drinking water storage in arid zones and reflect the region’s age-old wisdom in water conservation. Even today, it stands as a symbol of sustainable rural practices.' },
                    { type: 'image', src: 'images/Gajsar/5.jpg', size: 'big', caption: 'Team RetroFlow is conducting field surveys and water sample collections at Gajsar, Churu, with a focus on the dam and drainage system. The visit aimed to assess water quality, understand salinity issues, and document the existing water management infrastructure for future conservation efforts.' },
                    { type: 'image', src: 'images/Gajsar/6.jpg', size: 'big', caption: 'Sewage Treatment Plant and GRP Outlet Drainage – A Complementary System The Sewage Treatment Plant (STP) and GRP Outlet Drainage seen in the image work as a complementary system for managing wastewater efficiently. The STP treats sewage by removing harmful pollutants, making the water environmentally safe. The GRP Outlet Drainage then carries this treated water to nearby water bodies or agricultural fields, ensuring safe disposal or reuse. Together, they support clean water flow, pollution control, and promote sustainable water management in the region. However, during their visit, the RetroFlow team observed that the local water was highly saline, possibly due to contamination or infiltration from nearby treated sewage, making even normal drinking water unpleasantly salty.' },
                    { type: 'image', src: 'images/Gajsar/7.jpg', size: 'big', caption: 'Khara Pani Aquaculture Prayogshala –Located in Gajsar, Churu, this unique lab promotes fish farming using saline water. It experiments with salt-tolerant species, turning unfit water into a sustainable livelihood source for arid regions through innovative aquaculture practices.' },
                    { type: 'image', src: 'images/Gajsar/2.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Gajsar/8.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Gajsar/9.jpg', size: 'normal'}
                ];
                break
            case 'dadrewa':
                mediaFiles = [
                    { type: 'image', src: 'images/Dadrewa/1.jpg', size: 'big', caption: 'This structure in the image is a traditional underground water tank, locally known as a “Kundi”, found in Dadrewa village, Churu district, Rajasthan. ' },
                    { type: 'image', src: 'images/Dadrewa/2.jpg', size: 'big', caption: 'This dome-shaped Kundi in Churu is a traditional, centuries-old rainwater harvesting system built for water conservation in arid regions. Designed with a sloped catchment, underground tank, and domed top to keep water cool and clean, it includes a staircase leading to the inlet. Once a vital source of drinking water during droughts, many such Kundis are now being revived under schemes like MNREGA and Jal Shakti Abhiyan.' },
                    { type: 'image', src: 'images/Dadrewa/4.jpg', size: 'big', caption: 'Daab' },
                    { type: 'image', src: 'images/Dadrewa/5.jpg', size: 'big', caption: 'This rectangular Talab in Churu is a traditional community water body which is known as  Daab, related to the spiritual Gagoji God, once central to rainwater harvesting, ritual bathing, and cattle use. Bordered by masonry embankments, steps, and protective fencing, it reflects both historical utility and later restoration efforts. Though it still holds water, visible garbage accumulation highlights the urgent need for revival and cleanliness to restore its cultural and ecological value.' },
                    { type: 'image', src: 'images/Dadrewa/7.jpg', size: 'big', caption: 'Who is Goga ji....? Gogaji, the revered folk deity born in Dadrewa, Churu, is worshipped as the protector from snakebites and a symbol of courage and justice. His temple attracts thousands during the Gogaji Mela each year. Depicted on a blue horse with a cobra hood, he is honored by all communities, reflecting unity in faith and Rajasthan’s rich folk tradition.' },
                    { type: 'image', src: 'images/Dadrewa/11.jpg', size: 'big', caption: 'Mithdi Patta & Gogaji ka Talab' },
                    { type: 'image', src: 'images/Dadrewa/12.jpg', size: 'big', caption: 'In the heart of Dadrewa village, the area known as Mithdi Patta is famous for its numerous wells and stepwells (baoris). Built on a low-lying terrain, this zone naturally supports rainwater harvesting and groundwater recharge. The nearby Gogaji ka Talab plays a key role in keeping the water table high, making it an ideal spot for building multiple water structures.' },
                    { type: 'image', src: 'images/Dadrewa/19.jpg', size: 'big', caption: 'Situated close to the sacred Gogaji Temple, Mithdi Patta became a vital water source for pilgrims, rituals, and daily village life. These traditional wells reflect the wisdom of desert water management, ensuring year-round water availability in Churu’s arid climate. Even today, this area stands as a symbol of community-driven conservation and cultural heritage.' },
                    { type: 'image', src: 'images/Dadrewa/24.jpg', size: 'big', caption: 'The RetroFlow team visited Dadrewa to gather insights on traditional water structures like Gogaji ka Talab and the well-rich area of Mithdi Patta, exploring their design, purpose, and significance in local water conservation.' },
                    { type: 'image', src: 'images/Dadrewa/8.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/9.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/10.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/3.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/6.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/13.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/14.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/15.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/16.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/17.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/18.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/20.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/21.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/22.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/23.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Dadrewa/25.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/26.jpg', size: 'normal'},
                    { type: 'image', src: 'images/Dadrewa/27.jpg', size: 'normal'}
                ];
                break
                case 'amet':
                mediaFiles = [
                    { type: 'image', src: 'images/Amet/1.jpg', size: 'big', caption: 'Amet Heritage Site' },
                    { type: 'image', src: 'images/Amet/2.jpg', size: 'big', caption: 'Cultural Heritage of Amet' },
                    { type: 'image', src: 'images/Amet/3.jpg', size: 'big', caption: 'Historical Monuments' },
                    { type: 'image', src: 'images/Amet/4.jpg', size: 'normal', caption: 'Local Architecture' },
                    { type: 'image', src: 'images/Amet/5.jpg', size: 'normal', caption: 'Traditional Buildings' },
                    { type: 'image', src: 'images/Amet/6.jpg', size: 'normal', caption: 'Heritage Structures' },
                    { type: 'image', src: 'images/Amet/7.jpg', size: 'normal', caption: 'Cultural Landmarks' }
                ];
                break
                case 'kelwa':
                mediaFiles = [
                    { type: 'image', src: 'images/Kelwa/1.jpg', size: 'big', caption: 'Kelwa Heritage Site' },
                    { type: 'image', src: 'images/Kelwa/2.jpg', size: 'big', caption: 'Cultural Heritage of Kelwa' },
                    { type: 'image', src: 'images/Kelwa/3.jpg', size: 'big', caption: 'Historical Monuments' },
                    { type: 'image', src: 'images/Kelwa/4.jpg', size: 'normal', caption: 'Local Architecture' },
                    { type: 'image', src: 'images/Kelwa/5.jpg', size: 'normal', caption: 'Traditional Buildings' },
                    { type: 'image', src: 'images/Kelwa/6.jpg', size: 'normal', caption: 'Heritage Structures' },
                    { type: 'image', src: 'images/Kelwa/7.jpg', size: 'normal', caption: 'Cultural Landmarks' },
                    { type: 'image', src: 'images/Kelwa/8.jpg', size: 'normal', caption: 'Historical Sites' },
                    { type: 'image', src: 'images/Kelwa/9.jpg', size: 'normal', caption: 'Ancient Architecture' },
                    { type: 'image', src: 'images/Kelwa/10.jpg', size: 'normal', caption: 'Heritage Buildings' },
                    { type: 'image', src: 'images/Kelwa/11.jpg', size: 'normal', caption: 'Cultural Monuments' },
                    { type: 'image', src: 'images/Kelwa/12.jpg', size: 'normal', caption: 'Historical Landmarks' },
                    { type: 'image', src: 'images/Kelwa/13.jpg', size: 'normal', caption: 'Traditional Sites' },
                    { type: 'image', src: 'images/Kelwa/14.jpg', size: 'normal', caption: 'Heritage Architecture' },
                    { type: 'image', src: 'images/Kelwa/15.jpg', size: 'normal', caption: 'Cultural Sites' },
                    { type: 'image', src: 'images/Kelwa/16.jpg', size: 'normal', caption: 'Historical Buildings' },
                    { type: 'image', src: 'images/Kelwa/17.jpg', size: 'normal', caption: 'Ancient Monuments' },
                    { type: 'image', src: 'images/Kelwa/18.jpg', size: 'normal', caption: 'Heritage Structures' },
                    { type: 'image', src: 'images/Kelwa/19.jpg', size: 'normal', caption: 'Cultural Architecture' }
                ];
                break
                case 'rajnagar':
                mediaFiles = [
                    { type: 'image', src: 'images/Rajnagar/1.jpg', size: 'big', caption: 'Rajnagar Heritage Site' },
                    { type: 'image', src: 'images/Rajnagar/2.jpg', size: 'big', caption: 'Cultural Heritage of Rajnagar' },
                    { type: 'image', src: 'images/Rajnagar/3.jpg', size: 'big', caption: 'Historical Monuments' },
                    { type: 'image', src: 'images/Rajnagar/4.jpg', size: 'normal', caption: 'Local Architecture' },
                    { type: 'image', src: 'images/Rajnagar/5.jpg', size: 'normal', caption: 'Traditional Buildings' },
                    { type: 'image', src: 'images/Rajnagar/6.jpg', size: 'normal', caption: 'Heritage Structures' },
                    { type: 'image', src: 'images/Rajnagar/7.jpg', size: 'normal', caption: 'Cultural Landmarks' },
                    { type: 'image', src: 'images/Rajnagar/8.jpg', size: 'normal', caption: 'Historical Sites' },
                    { type: 'image', src: 'images/Rajnagar/9.jpg', size: 'normal', caption: 'Ancient Architecture' },
                    { type: 'image', src: 'images/Rajnagar/10.jpg', size: 'normal', caption: 'Heritage Buildings' },
                    { type: 'image', src: 'images/Rajnagar/11.jpg', size: 'normal', caption: 'Cultural Monuments' },
                    { type: 'image', src: 'images/Rajnagar/12.jpg', size: 'normal', caption: 'Historical Landmarks' },
                    { type: 'image', src: 'images/Rajnagar/13.jpg', size: 'normal', caption: 'Traditional Sites' },
                    { type: 'image', src: 'images/Rajnagar/14.jpg', size: 'normal', caption: 'Heritage Architecture' },
                    { type: 'image', src: 'images/Rajnagar/15.jpg', size: 'normal', caption: 'Cultural Sites' },
                    { type: 'image', src: 'images/Rajnagar/16.jpg', size: 'normal', caption: 'Historical Buildings' },
                    { type: 'image', src: 'images/Rajnagar/17.jpg', size: 'normal', caption: 'Ancient Monuments' }
                ];
                break
                case 'rajasmand':
                mediaFiles = [
                    { type: 'image', src: 'images/Rajasmand/1.jpg', size: 'big', caption: 'Rajasmand Lake - Scenic View' },
                    { type: 'image', src: 'images/Rajasmand/2.jpg', size: 'big', caption: 'Rajasmand Lake - Tranquil Waters' },
                    { type: 'image', src: 'images/Rajasmand/3.jpg', size: 'normal', caption: 'Rajasmand Lake - Sunset' },
                    { type: 'image', src: 'images/Rajasmand/4.jpg', size: 'normal', caption: 'Rajasmand Lake - Heritage Site' }
                ];
                break;
            case 'gogelaw':
                mediaFiles = [
                    { type: 'image', src: 'images/Gogelaw/1.jpg', size: 'big', caption: 'Gogelaw - Traditional Water Conservation Site' },
                    { type: 'image', src: 'images/Gogelaw/2.jpg', size: 'big', caption: 'Here, the JCKIC team, RetroFlow member (Adarsh Singh), is discussing the Nadi with a local person and observing the arid region of Gogelaw.' },
                    { type: 'image', src: 'images/Gogelaw/4.jpg', size: 'big', caption: 'Nadi’s or johads are traditional, community-built rainwater ponds found across western Rajasthan. They recharge groundwater and support drinking and livestock needs. Many in Nagaur, including the Gogelaw region, are estimated to be 300–600 years old, with some in the area dating back up to 1,000 years.' },
                    { type: 'image', src: 'images/Gogelaw/9.jpg', size: 'big', caption: 'A Nadi (river) is a natural watercourse that plays a crucial role in sustaining life and supporting ecosystems. It provides water for drinking, irrigation, and industrial use. Rivers enrich agricultural lands by supplying water and depositing fertile silt. They also support hydropower generation and serve as transportation routes in certain regions. Overall, rivers are essential for environmental balance, human livelihood, and economic activities.' },
                    { type: 'image', src: 'images/Gogelaw/12.jpg', size: 'big', caption: 'This is a dual-pipe culvert in Gogelaw, Ajmer Division, Rajasthan, built for rainwater drainage and runoff management. It helps prevent soil erosion and flooding by channelling excess water, likely supporting nearby Nadi’s or traditional water bodies.' },
                    { type: 'image', src: 'images/Gogelaw/13.jpg', size: 'big', caption: 'Located in Gogelaw, this Adarsh Talaab spans 2000 bighas, storing rainwater and supporting cattle grazing. A nearby Tanka stores drinking water, while Talaab serves as a water source for animals. The lush plains, called Angor in Marwar, reflect smart water use. Goga Talab adds to the village’s eco-friendly water heritage.' },
                    { type: 'image', src: 'images/Gogelaw/17.jpg', size: 'big', caption: 'A traditional circular well located in Gogelaw, Nagaur, Rajasthan, built with red sandstone bricks. It is likely 10 to 30 years old and measures approximately 1.5 to 1.7 meters in height and 4.5 to 5.5 meters in diameter, with a typical depth of 10 to 30 meters. The well is used for groundwater storage and rainwater harvesting, serving local needs for drinking, livestock, and domestic use in the arid climate of the region.' },
                    { type: 'image', src: 'images/Gogelaw/20.jpg', size: 'big', caption: 'This is a circular Nadi (pond) structure located in Gogelaw, Ajmer Division, Rajasthan, used for rainwater harvesting. As per the stone inscription visible, it was constructed under the MGNREGA scheme, likely around 2014-15. The pond has a diameter of 30 meters, a depth of 1.5 meters, and a storage capacity of approximately. 1050 cubic meters. It helps recharge groundwater and supports local agriculture and livestock during dry seasons.' },
                    { type: 'image', src: 'images/Gogelaw/3.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Gogelaw/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Gogelaw/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Gogelaw/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Gogelaw/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Gogelaw/10.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Gogelaw/11.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Gogelaw/14.png', size: 'normal' },
                    { type: 'image', src: 'images/Gogelaw/15.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Gogelaw/16.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Gogelaw/18.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Gogelaw/19.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Gogelaw/21.jpg', size: 'normal' }
                ];
                break;
            case 'barani':
                mediaFiles = [
                    { type: 'image', src: 'images/Barani/1.jpg', size: 'big', caption: 'Barani (Nagaur)' },
                    { type: 'image', src: 'images/Barani/2.jpg', size: 'big', caption: 'Kachauliya Nadi' },
                    { type: 'image', src: 'images/Barani/3.jpg', size: 'big', caption: 'A cemented and stone masonry Nadi structure. It is a traditional open circular water reservoir, constructed to collect and store rainwater for local use, primarily domestic use, livestock, and sometimes irrigation in rural arid areas. The solid boundary shows modern reinforcement, likely to reduce seepage and erosion.' },
                    { type: 'image', src: 'images/Barani/4.jpg', size: 'big', caption: 'This is a government-built rainwater harvesting structure (Nadi) under MGNREGA in Nagaur district, Rajasthan, built around 2020–2021. It serves to collect monsoon rainwater, critical for water security in arid regions like Nagaur.' },
                    { type: 'image', src: 'images/Barani/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Barani/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Barani/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Barani/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Barani/9.jpg', size: 'normal' }
                ];
                break;
            case 'alai':
                mediaFiles = [
                    { type: 'image', src: 'images/Alai/1.jpg', size: 'big', caption: 'This Nadi in Alai village, Ajmer (Rajasthan) was built under MGNREGA in January 2022 at a cost of ₹2.84 lakh. Spread over 25×32 meters, it stores rainwater for agriculture, cattle use, and groundwater recharge. The area is semi-arid, and the Nadi supports local water needs sustainably.' },
                    { type: 'image', src: 'images/Alai/2.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Alai/3.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Alai/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Alai/5.jpg', size: 'normal' }
                ];
                break;
            case 'shribalaji':
                mediaFiles = [
                    { type: 'image', src: 'images/Shribalaji/1.jpg', size: 'big', caption: 'Shree Bala ji (Nagaur)' },
                    { type: 'image', src: 'images/Shribalaji/2.jpg', size: 'big', caption: 'This is a cemented rectangular tank used to collect and store rainwater for domestic use in arid regions like Rajasthan. Typically built at the household or community level, it aids water availability during dry months. Based on its cement construction and PVC fittings, it appears to be less than 10 years old. Its estimated dimensions are 3–4 m in width and 1.2–1.5 m in height. The attached pipes suggest rooftop or surface runoff water collection.' },
                    { type: 'image', src: 'images/Shribalaji/3.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Shribalaji/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Shribalaji/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Shribalaji/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Shribalaji/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Shribalaji/8.jpg', size: 'normal' }
                ];
                break;
            case 'beer':
                mediaFiles = [
                    { type: 'image', src: 'images/Beer/1.jpg', size: 'big', caption: 'Beer (Ajmer) \n An old(200-500yr) neglected well ( a traditional water structure,  a bawdi or kuan) located in a rural or semi-urban area OF BEER panchayat (Ajmer) this well  is oldest well in entire beer village  its deep around 20-30feet. Well is  a part of the village’s water heritage, now being forgotten.'},
                    { type: 'image', src: 'images/Beer/2.jpg', size: 'big', caption: 'Condition:- \n •  The ground around the well is littered with garbage, plastic waste, cloth, and other debris. \n •  Vegetation is overgrown, with thorny bushes and wild plants encroaching on the structure. \n • cultural Loss – The well is likely a part of the village’s water heritage, now being forgotten. \n •  Health Hazard – Garbage accumulation can cause water contamination, spread of diseases, and pest issues. \n Structure:-Cracks between walls of well ' },
                    { type: 'image', src: 'images/Beer/4.jpg', size: 'big', caption: 'The people of Beer village used to rely entirely on this well for drinking water and daily needs. According to the village elders, they were completely dependent on this well. But ever since the water level started to drop, the well dried up, and now they rely on supplied water. In this area, groundwater is found only after digging 80 to 100 feet deep, and in some places, even deeper. Even if water is found, it is often saline and contains high levels of nitrate and fluoride' },
                    { type: 'image', src: 'images/Beer/5.jpg', size: 'big', caption: '2.Bawdi Beer village in Ajmer, Rajasthan, stands a 400-year-old stepwell — a forgotten lifeline of the past. \n According to village elders, this stepwell once fulfilled all the water needs of the community — farom drinking water to irrigation and even for animals during scorching summers. \n Where now there’s garbage, overgrown weeds, and silence… there once echoed the laughter of children, the sounds of women drawing water, and the rhythm of daily life.' },
                    { type: 'image', src: 'images/Beer/6.jpg', size: 'big', caption: 'the people of Beer say: \n ‘This stepwell is our identity… Saving it is no longer just a need — it’s our responsibility.  ’ \n This ancient structure is a living testimony of how our ancestors preserved water with wisdom and care — and how today, that wisdom lies buried in neglect.' },
                    { type: 'image', src: 'images/Beer/7.jpg', size: 'big' , caption: 'Now is the time — to clean it, restore it, and bring back its pride as a symbol of our heritage.' },
                    { type: 'image', src: 'images/Beer/10.jpg', size: 'big' , caption : '2.Phool Sagar-is a historic water reservoir located about 1–2 km from the Panchayat Bhawan of Beer village in Ajmer district, Rajasthan. Locals estimate that this reservoir is more than 500 years old, possibly built by the local royal or administrative systems of the time to meet drinking and irrigation needs of the surrounding region.'},
                    { type: 'image', src: 'images/Beer/12.jpg', size: 'big' , caption: 'Current Water Condition Though the water looks clean, it contains high levels of salinity, fluoride, and nitrates. Its unsafe for drinking, can cause health issues, and affects agriculture and livestock. Groundwater recharge happens, but the water quality remains poor.' },
                    { type: 'image', src: 'images/Beer/14.jpg', size: 'big' , caption: 'Road to phool sagar'},
                    { type: 'image', src: 'images/Beer/15.jpg', size: 'big' , caption: 'BHAWANTA (Ajmer)' },
                    { type: 'image', src: 'images/Beer/3.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Beer/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Beer/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Beer/11.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Beer/13.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Beer/16.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Beer/17.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Beer/18.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Beer/19.jpg', size: 'normal' }
                ];
                break;
            case 'banseli':
                mediaFiles = [
                    { type: 'image', src: 'images/Banseli/1.jpg', size: 'big', caption: 'Banseli (Ajmer)' },
                    { type: 'image', src: 'images/Banseli/2.jpg', size: 'big', caption: 'Traditional water heritage of Banseli' },
                    { type: 'image', src: 'images/Banseli/3.jpg', size: 'big', caption: 'Local water conservation practices' }
                ];
                break;
            case 'atoon':
                mediaFiles = [
                    { type: 'image', src: 'images/Atoon/1.jpg', size: 'big', caption: 'Atoon (Bhilwara)' },
                    { type: 'image', src: 'images/Atoon/2.jpg', size: 'big', caption: 'Traditional water heritage of Atoon' },
                    { type: 'image', src: 'images/Atoon/3.jpg', size: 'big', caption: 'Local water conservation practices' },
                    { type: 'image', src: 'images/Atoon/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Atoon/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Atoon/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Atoon/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Atoon/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Atoon/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Atoon/10.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Atoon/11.jpg', size: 'normal' }
                ];
                break;
            case 'pansal':
                mediaFiles = [
                    { type: 'image', src: 'images/Pansal/1.jpg', size: 'big', caption: 'Pansal (Bhilwara)' },
                    { type: 'image', src: 'images/Pansal/2.jpg', size: 'big', caption: 'Traditional water heritage of Pansal' },
                    { type: 'image', src: 'images/Pansal/3.jpg', size: 'big', caption: 'Local water conservation practices' },
                    { type: 'image', src: 'images/Pansal/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Pansal/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Pansal/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Pansal/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Pansal/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Pansal/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Pansal/10.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Pansal/11.jpg', size: 'normal' },
                    { type: 'image', src: 'images/Pansal/12.jpg', size: 'normal' }
                ];
                break;
            case 'mandal':
                mediaFiles = [
                    { type: 'image', src: 'images/Mandal/1.jpg', size: 'big', caption: 'Mandal (Bhilwara)' },
                    { type: 'image', src: 'images/Mandal/2.jpg', size: 'big', caption: 'Traditional water heritage of Mandal' },
                    { type: 'image', src: 'images/Mandal/3.png', size: 'big', caption: 'Local water conservation practices' },
                    { type: 'image', src: 'images/Mandal/4.png', size: 'normal' },
                    { type: 'image', src: 'images/Mandal/5.png', size: 'normal' },
                    { type: 'image', src: 'images/Mandal/6.png', size: 'normal' },
                    { type: 'image', src: 'images/Mandal/7.png', size: 'normal' },
                    { type: 'image', src: 'images/Mandal/8.png', size: 'normal' },
                    { type: 'image', src: 'images/Mandal/9.png', size: 'normal' },
                    { type: 'image', src: 'images/Mandal/10.png', size: 'normal' }
                ];
                break;
            case 'keerkhera':
                mediaFiles = [
                    { type: 'image', src: 'images/Keerkhera/1.jpg', size: 'big', caption: 'Keerkhera (Bhilwara)' },
                    { type: 'image', src: 'images/Keerkhera/2.jpg', size: 'big', caption: 'Traditional water heritage of Keerkhera' },
                    { type: 'image', src: 'images/Keerkhera/3.jpg', size: 'big', caption: 'Local water conservation practices' }
                ];
                break;
            case 'meja':
                mediaFiles = [
                    { type: 'image', src: 'images/Meja/1.jpg', size: 'big', caption: 'Meja Dam (Bhilwara)' },
                    { type: 'image', src: 'images/Meja/2.png', size: 'big', caption: 'Traditional water heritage of Meja Dam' },
                    { type: 'image', src: 'images/Meja/3.jpg', size: 'big', caption: 'Local water conservation practices' }
                ];
                break;
            case 'delwara':
                mediaFiles = [
                    { type: 'image', src: 'images/Delwara/1.jpg', size: 'big', caption: 'Delwara (Jalore)' },
                    { type: 'image', src: 'images/Delwara/2.jpg', size: 'big', caption: 'Traditional water heritage of Delwara' },
                    { type: 'image', src: 'images/Delwara/3.jpg', size: 'big', caption: 'Local water conservation practices' }
                ];
                break;
            case 'bhinmal':
                mediaFiles = [
                    { type: 'image', src: 'images/Bhinmal/1.jpg', size: 'big', caption: 'Bhinmal (Jalore)' },
                    { type: 'image', src: 'images/Bhinmal/2.jpg', size: 'big', caption: 'Traditional water heritage of Bhinmal' },
                    { type: 'image', src: 'images/Bhinmal/3.jpg', size: 'big', caption: 'Local water conservation practices' },
                    { type: 'image', src: 'images/Bhinmal/4.jpg', size: 'normal' }
                ];
                break;
            case 'bharoori':
                mediaFiles = [
                    { type: 'image', src: 'images/Bharoori/1.jpg', size: 'big', caption: 'Bharoori (Jalore) \n This well, located in Bharoori village of Bhinmal, Jalore district, was once a vital source of water for the local community. Built with strong stone masonry and reinforced with a concrete ring at the top, it reflects the traditional water architecture of rural Rajasthan. At the center, an iron shaft suggests it was earlier used with a pulley or hand pump system to draw water. Today, the well lies neglected, surrounded by garbage and signs of disuse. Despite its current condition, it stands as a symbol of the villages heritage and the sustainable water practices of the past. With proper cleaning and restoration, this well in Bharoori could once again serve the community and become part of local water conservation efforts.' }
                ];
                break;
            default:
                // Handle unknown location or display a message
                galleryGrid.innerHTML = '<p>Gallery not available for this location.</p>';
                return;
        }

        // Add all media files to gallery items
        galleryItems = mediaFiles;

        // Create gallery grid
        createGalleryGrid();
    } catch (error) {
        console.error('Error loading gallery items:', error);
        galleryGrid.innerHTML = '<p>Error loading gallery items. Please try again later.</p>';
    }
}

// Create gallery grid
function createGalleryGrid() {
    galleryGrid.innerHTML = '';

    galleryItems.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'location-gallery-item';

        if (item.size === 'big') {
            itemElement.classList.add('big-image');
        } else {
            itemElement.classList.add('normal-image');
        }

        if (item.type === 'video') {
            itemElement.classList.add('video-item');
            const video = document.createElement('video');
            video.src = item.src;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.addEventListener('loadeddata', () => {
                video.currentTime = 1; // Set to a frame after the first second
            });
            itemElement.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = `Gallery image ${index + 1}`;
            itemElement.appendChild(img);
            if (item.caption) {
                const caption = document.createElement('span');
                caption.className = 'image-caption';
                caption.textContent = item.caption;
                itemElement.appendChild(caption);
            }
        }

        itemElement.addEventListener('click', () => openLightbox(index));
        galleryGrid.appendChild(itemElement);
    });
}

// Open lightbox
function openLightbox(index) {
    currentIndex = index;
    const item = galleryItems[index];

    if (item.type === 'video') {
        lightboxImage.style.display = 'none';
        lightboxVideo.style.display = 'block';
        lightboxVideo.src = item.src;
        lightboxVideo.play();
    } else {
        lightboxVideo.style.display = 'none';
        lightboxImage.style.display = 'block';
        lightboxImage.src = item.src;
        const lightboxCaption = document.getElementById('lightbox-caption');
        if (item.caption) {
            lightboxCaption.textContent = item.caption;
            lightboxCaption.style.display = 'block';
        } else {
            lightboxCaption.style.display = 'none';
        }
    }

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close lightbox
function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    lightboxVideo.pause();
    lightboxVideo.src = '';
}

// Navigate through gallery
function navigateGallery(direction) {
    currentIndex = (currentIndex + direction + galleryItems.length) % galleryItems.length;
    openLightbox(currentIndex);
}

// Event Listeners
closeButton.addEventListener('click', closeLightbox);
prevButton.addEventListener('click', () => navigateGallery(-1));
nextButton.addEventListener('click', () => navigateGallery(1));

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;

    switch (e.key) {
        case 'Escape':
            closeLightbox();
            break;
        case 'ArrowLeft':
            navigateGallery(-1);
            break;
        case 'ArrowRight':
            navigateGallery(1);
            break;
    }
});

// Close lightbox when clicking outside
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        closeLightbox();
    }
});

// Initialize gallery
loadGalleryItems(); 