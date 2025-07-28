// Get the current location from the page title
const titleParts = document.title.split(' ');
let currentLocation = '';
if (titleParts.length >= 4 && titleParts[1] === '-') {
    // Handle multi-word location names like "Sardar Samand"
    if (titleParts[2] === 'Sardar' && titleParts[3] === 'Samand') {
        currentLocation = 'sardar_samand';
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
                        { type: 'image', src: 'images/khejarala/1.jpg', caption: 'Khejarla village (jodhpur) Map', size: 'big' },
                        { type: 'image', src: 'images/khejarala/2.jpg', caption: 'Shree Rajendra bhakar (Agriculture Supervisor) showing the sites image of traditional water Bodies to Aadarsh singh (memb. Of Team RetroFlow)\nthat How he Try to  Revive Traditinal water Bodies with NGO\'s and Also by itself.', size: 'big' },
                        { type: 'image', src: 'images/khejarala/3.jpg', caption: 'Team RETROFLOW and with Shree Muldan chaaran in Khejarla', size: 'big' },
                        { type: 'image', src: 'images/khejarala/5.jpg', caption: 'This( Tanka) prenset in a Primary govt. School for Used in drinking and Other purpose  Tanka:used to store Rain water and underground water storage structure mainly found in Rajasthan arid region.\nSTRUCTURE: circular or square underground tank,plastered with lime or cement to prevent seepage.', size: 'big' },
                        { type: 'image', src: 'images/khejarala/8.jpg', caption: 'Sujaan Sagar Talab its an ancient talab local people and other outsider also come to fill up water for drinking and used for irrigation  and its very helpful for animals during rainy season its totally filled with water .  \nTalab is a traditional water storage system commonly found in Rajasthan. These are man-made ponds or reservoirs used to store rainwater, especially in arid and semi-arid regions. Talabs play a crucial role in meeting the water needs of local communities for drinking, irrigation, and livestock. Often surrounded by ghats and steps, many talabs are centuries old and hold religious and cultural importance. Famous examples include Pichola Talab in Udaipur and Padamsar Talab in Jaisalmer. They showcase the wisdom of ancient water conservation techniques in a desert state like Rajasthan.', size: 'big' },
                        { type: 'image', src: 'images/khejarala/10.jpg', caption: 'Government Handpump used for drinking water and other purposes in (khejarla) water available at 250-300 feet and its contain Floride and salinity which causes tooth decay and bone become weak and other problems', size: 'big' },
                        { type: 'image', src: 'images/khejarala/11.jpg', caption: 'A canal is a man-made water channel used primarily for irrigation. It helps transport water from rivers, reservoirs, or dams to agricultural fields, enabling farmers to grow crops even during dry seasons. Canals play a crucial role in improving crop yield, supporting the rural economy and ensuring food security. In many Indian villages, canal systems are managed by government irrigation departments or local panchayats. They also help recharge groundwater levels and support nearby vegetation.', size: 'big' },
                        { type: 'image', src: 'images/khejarala/13.jpg', caption: '(NADI)- its deep around 20-25 feet, this  is used to store rain water, drinking irrigation  and livestock during rainy season its totally filled  up to stairs , its is usually a shallow ,earthen depression designed to collect and store rainwater during the monsoon. Nadis are crucial for meeting the basic water needs of rural communities — including drinking water for humans and animals. Unlike talabs, nadis are smaller and often located on the outskirts of villages. They recharge groundwater and support local ecology.', size: 'big' },
                        { type: 'image', src: 'images/khejarala/16.jpg', caption: 'Jinn ka bera(WELL):its an ancient well(100 -200year old) according to local mythology they said it was build by jinn ,in one night it just beside (NADI) its deep around according to local (25-30 feet. (WELL): Short Note on Well of Rajasthan (Structure & Depth Details):\nWells (Kuan or Beri) are traditional water sources in Rajasthan, widely used for accessing underground water, especially in areas with limited surface water. They are typically circular or square in shape and constructed using stone (Use for Drinking,irrigation and livestocks.', size: 'big' },
                        { type: 'image', src: 'images/khejarala/18.jpg', caption: 'A cyclindrical tanka: A cylindrical tanka is a traditional underground rainwater harvesting structure used mainly in arid regions of Rajasthan. It is a circular, covered tank made of lime mortar, stone, or cement, designed to collect rainwater from rooftops or courtyards.', size: 'big' },
                        { type: 'image', src: 'images/khejarala/4.jpg', size: 'normal' },
                        { type: 'image', src: 'images/khejarala/6.jpg', size: 'normal' },
                        { type: 'image', src: 'images/khejarala/7.jpg', size: 'normal' },
                        { type: 'image', src: 'images/khejarala/9.jpg', size: 'normal' },
                        { type: 'image', src: 'images/khejarala/12.jpg', size: 'normal' },
                        { type: 'image', src: 'images/khejarala/14.jpg', size: 'normal' },
                        { type: 'image', src: 'images/khejarala/15.jpg', size: 'normal' },
                        { type: 'image', src: 'images/khejarala/17.jpg', size: 'normal' },
                        { type: 'video', src: 'images/khejarala/video1.mp4' },
                        { type: 'video', src: 'images/khejarala/video2.mp4' },
                        { type: 'video', src: 'images/khejarala/video3.mp4' },
                        { type: 'video', src: 'images/khejarala/video4.mp4' },
                        { type: 'video', src: 'images/khejarala/video5.mp4' },
                        { type: 'video', src: 'images/khejarala/video6.mp4' },
                        { type: 'video', src: 'images/khejarala/video7.mp4' },
                        { type: 'video', src: 'images/khejarala/video8.mp4' }
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
                    { type: 'image', src: 'images/sangariya/1.jpg', caption: 'Unnamed Nadi of Sangariya, which was once a source of water for all daily chores, and today it is only for animals, because of urbanization, water supply to people is easy, and they get fresh, clean water instead of getting salty water from underground or well.', size: 'big' },
                    { type: 'image', src: 'images/sangariya/18.jpg', caption: 'Sarpanch shares local insight, RetroFlow shares new ideas – collaboration begins here with JCKIC.', size: 'big' },
                    { type: 'image', src: 'images/sangariya/2.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/3.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/10.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/11.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/12.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/13.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/14.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/15.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/16.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/17.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/19.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/20.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/21.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sangariya/22.jpg', size: 'normal' }
                ];
                break;
            case 'salawas':
                mediaFiles = [
                        { type: 'image', src: 'images/salawas/1.jpg', caption: 'THULAI NADI', size: 'big' },
                        { type: 'image', src: 'images/salawas/2.jpg', caption: 'Thulai Nadi – Kishna Nagar (Salawas)-This over-100-year-old saline water Nadi served as a vital water source for Krishna Sarnagar\'s 17,000 residents. Historically, it supported drinking, domestic needs, irrigation, and cattle. It is spread over 15-20 bigha, and its source is water from Bhakar (Little Mountains). A well (Beri) lies at its centre, submerged during the rainy season when the Nadi fills completely. Its depth goes to 120-150 feet.', size: 'big' },
                        { type: 'image', src: 'images/salawas/6.jpg', caption: 'RetroFlow team members conducted a detailed survey of Thulai Nadi along with local jan pratinidhi (public representatives), assessing its condition and community significance.', size: 'big' },
                        { type: 'image', src: 'images/salawas/10.jpg', caption: 'Team on field work surveying the present condition of the traditional water bodies', size: 'big' },
                        { type: 'image', src: 'images/salawas/16.jpg', caption: 'RetroFlow team interacting with the villagers through the public representatives & discussing the present water quality of Salawas.', size: 'big' },
                        { type: 'image', src: 'images/salawas/17.jpg', caption: 'Discussed the water conservation initiatives by JCKIC, while Team RetroFlow shared insights on JCKIC features that can be adapted in the future to address local water challenges.', size: 'big' },
                        { type: 'image', src: 'images/salawas/18.jpg', caption: 'Ghadai Nadi', size: 'big' },
                        { type: 'image', src: 'images/salawas/19.jpg', caption: 'Gudhai Nadi, one of the oldest rainwater harvesting structures, is now primarily used for cattle and is seasonally filled by the efforts of local villagers.', size: 'big' },
                        { type: 'image', src: 'images/salawas/23.jpg', caption: 'Joon ki Bawadi is a historic stepwell, estimated to be over 200–400 years old, serving as a vital water source for the local community in earlier times. It holds cultural and spiritual significance, as it is maintained and watched over by Baba Bhairavji, a revered local guardian. Once known for its clean and deep water, the bawadi now faces severe pollution due to waste discharge from nearby steel industries in the Salawas area. This contamination has impacted its usability, turning a heritage water structure into an environmental concern.', size: 'big' },
                        { type: 'image', src: 'images/salawas/25.jpg', caption: 'Baba Bhairavji expressed deep concern over the pollution of the once-sacred Jojari River, now contaminated by waste from nearby steel industries. He reflected on how time has changed everything—turning a pure lifeline into a polluted stream—urging the need to restore balance between progress and nature.', size: 'big' },
                        { type: 'image', src: 'images/salawas/3.jpg', size: 'normal' },
                        { type: 'image', src: 'images/salawas/4.jpg', size: 'normal' },
                        { type: 'image', src: 'images/salawas/5.jpg', size: 'normal' },
                        { type: 'image', src: 'images/salawas/7.jpg', size: 'normal' },
                        { type: 'image', src: 'images/salawas/8.jpg', size: 'normal' },
                        { type: 'image', src: 'images/salawas/9.jpg', size: 'normal' },
                        { type: 'image', src: 'images/salawas/11.jpg', size: 'normal' },
                        { type: 'image', src: 'images/salawas/12.jpg', size: 'normal' },
                        { type: 'image', src: 'images/salawas/13.jpg', size: 'normal' },
                        { type: 'image', src: 'images/salawas/14.jpg', size: 'normal' },
                        { type: 'image', src: 'images/salawas/15.jpg', size: 'normal' },
                        { type: 'image', src: 'images/salawas/20.jpg', size: 'normal' },
                        { type: 'image', src: 'images/salawas/21.jpg', size: 'normal' },
                        { type: 'image', src: 'images/salawas/22.jpg', size: 'normal' },
                        { type: 'image', src: 'images/salawas/24.jpg', size: 'normal' }
                         ];
                break;
            case 'osian':
                mediaFiles = [
                        { type: 'image', src: 'images/osian/1.jpg', caption: 'In Osian, the Sarpanch and RetroFlow team discussed water issues and explored ideas to revive traditional bawdis from neglected dumping sites.', size: 'big' },
                        { type: 'image', src: 'images/osian/2.jpg', caption: 'KATAN BAWARI', size: 'big' },
                        { type: 'image', src: 'images/osian/13.jpg', caption: 'Built in the 10th century, Katan Bawadi is one of the lesser-known yet architecturally significant stepwells of Rajasthan.\nIts style is somewhat simpler compared to the grand Chand Baori of Abhaneri but still exhibits traditional Rajput and early medieval craftsmanship.\nIt served as a community water source, a place for cooling off in summer, and ritualistic or spiritual use, which is common for stepwells in desert regions.\nIt was once listed on the UNESCO World Heritage Tentative List under "Stepwells of India" in 2008, recognizing its cultural importance.', size: 'big' },
                        { type: 'image', src: 'images/osian/19.jpg', caption: 'BADI NADI', size: 'big' },
                        { type: 'image', src: 'images/osian/23.jpg', caption: 'This is the oldest Nadi in Osian Village, which was built a century ago and served as a community water source, performing Hindu rituals as well as used for spiritual purposes, but today this nadi is not clean due to things they use in performing rituals. It is called \'Badi Nadi\'\nBecause of the area it occupies, which should be a minimum of 1-2 Bigha, or length is about 200m, and the breadth is 50-60m.', size: 'big' },
                        { type: 'image', src: 'images/osian/3.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/4.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/5.jpg', size: 'normal' }, 
                        { type: 'image', src: 'images/osian/8.jpg', size: 'normal' }, 
                        { type: 'image', src: 'images/osian/6.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/7.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/9.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/10.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/11.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/12.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/14.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/15.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/16.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/17.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/18.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/20.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/21.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/22.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/24.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/25.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/26.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/27.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/28.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/29.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/30.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/31.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/32.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/33.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/34.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/35.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/36.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/37.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/38.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/39.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/40.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/41.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/42.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/43.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/44.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/45.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/46.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/47.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/48.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/49.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/50.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/51.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/52.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/53.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/54.jpg', size: 'normal' },
                        { type: 'image', src: 'images/osian/55.jpg', size: 'normal' }
                         ];
                break;
            case 'mathania':
                mediaFiles = [
                    { type: 'image', src: 'images/mathania/1.jpg', caption: 'CHHOTI NADI-1:\nIt is a normal old Nadi which is regenerated by Sarpanch/Chairman of Mathania', size: 'big' },
                    { type: 'image', src: 'images/mathania/2.jpg', caption: 'AABA NADA NADI-2 :\nAaba Nadi is another oldest Nadis of Mathania, regenerated under MNREGA, which was the largest Nadi of Mathania.', size: 'big' },
                    { type: 'image', src: 'images/mathania/6.jpg', caption: 'CHHOTI BAWADI :\nThese are the oldest Bawadi\'s, as per information from the local people of Mathania, which was the source of water for the community in the earlier times, but after the pipelines were laid & as water level dropped too low, these were used as a Garbage dumping site.', size: 'big' },
                    { type: 'image', src: 'images/mathania/11.jpg', caption: 'PURANA AYURVEDIC BAWADI', size: 'big' },
                    { type: 'image', src: 'images/mathania/12.jpg', caption: 'Karni Mata Ji Temple-BAWADI', size: 'big' },
                    { type: 'image', src: 'images/mathania/15.jpg', caption: 'HOUSE BUILT ON UNKNOWN BAWADI-1 :\nIn many Rajasthani towns, old bawris have been built over with houses and shops.\nAs stepwells dried up, people turned them into homes or commercial spaces.\nToday, many live or work above forgotten heritage structures.\nThis urban use hides history and risks damaging the original architecture.', size: 'big' },
                    { type: 'image', src: 'images/mathania/16.jpg', caption: 'HOUSE BUILT ON UNKNOWN BAWADI-3', size: 'big' },
                    { type: 'image', src: 'images/mathania/17.jpg', caption: 'HOUSE BUILT ON UNKNOWN BAWADI-2', size: 'big' },
                    { type: 'image', src: 'images/mathania/18.jpg', caption: 'HOUSE BUILT ON UNKNOWN BAWADI-1', size: 'big' },
                    { type: 'image', src: 'images/mathania/20.jpg', caption: 'HOUSE BUILT ON UNKNOWN BAWADI-3', size: 'big' },
                    { type: 'image', src: 'images/mathania/21.jpg', caption: 'HOUSE BUILT ON UNKNOWN BAWADI-1', size: 'big' },
                    { type: 'image', src: 'images/mathania/22.jpg', caption: 'HOUSE BUILT ON UNKNOWN BAWADI-1', size: 'big' },
                    { type: 'image', src: 'images/mathania/26.jpg', caption: 'BERA-Jat Community:\nIn Mathanya village, the Bera once served as a key water source for the community.It provided drinking water and supported daily needs for years. With time, due to less rainfall and overuse, the water level declined.\nAs the Bera dried up, its importance gradually faded.People began using the space for waste dumping and neglect grew.\nA once vital lifeline turned into a forgotten, polluted site.', size: 'big' },
                    { type: 'image', src: 'images/mathania/28.jpg', caption: 'BERA-Jat Community', size: 'big' },
                    { type: 'image', src: 'images/mathania/30.jpg', caption: 'Rain water-Harvesting System', size: 'big' },
                    { type: 'image', src: 'images/mathania/31.jpg', caption: 'In a powerful exchange of vision and values, the Sarpanch of Mathania shares deep insights on water problems and extinction traditional water bodies with Aditya Gautam(team leader) RetroFlow and Nishant Poddar— where grassroots experience meets youthful leadership.', size: 'big' },
                    { type: 'image', src: 'images/mathania/3.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/10.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/13.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/14.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/19.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/23.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/24.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/25.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/27.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/29.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/32.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/33.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/34.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/35.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mathania/36.jpg', size: 'normal' }
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
                    { type: 'image', src: 'images/sardar_samand/13.jpg', caption: 'Bera : In Sardar Samandh, there exists an over 100-year-old Nadi built by Kishore Singh, a highly respected figure of the region. This traditional water source once used a bull-powered chakki (grinding wheel) to draw water, which was not only used for irrigation but also for grinding wheat into atta (flour). The system combined water extraction and food processing, reflecting the self-sustaining rural ingenuity of the time. Though largely forgotten today, it stands as a symbol of heritage and innovation rooted in the community\'s past.', size: 'big' },
                    { type: 'image', src: 'images/sardar_samand/16.jpg', caption: 'Atta Chakki', size: 'big' },
                    { type: 'image', src: 'images/sardar_samand/18.jpg', caption: 'In Sardar Samand Panchayat, Aditya Gautam(Team Leader of RetroFlow) engages in a thoughtful discussion with the Panchayat Secretary about the Beri present in the Nadi, while collecting water samples for analysis. The conversation also focused on the initiatives taken by JCKIC to preserve and rejuvenate traditional water bodies in the region.', size: 'big' },
                    { type: 'image', src: 'images/sardar_samand/22.jpg', caption: 'Team RetroFlow, representing JCKIC, held a discussion with the Sardar Samand Panchayat members and the Sarpanch on improving water quality and preservation of saline water, while proposing the installation of rainwater harvesting systems as a sustainable solution for the region\'s future.', size: 'big' },
                    { type: 'image', src: 'images/sardar_samand/3.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/10.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/12.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/14.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/15.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/17.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/19.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/20.jpg', size: 'normal' },
                    { type: 'image', src: 'images/sardar_samand/21.jpg', size: 'normal' }
                ];
                break;
            case 'pokhran':
                mediaFiles = [
                    { type: 'image', src: 'images/pokhran/1.jpg', caption: 'Pokhran & Ramdevra - Traditional Water Body', size: 'big' },
                    { type: 'image', src: 'images/pokhran/2.jpg', caption: 'Ancient Stepwell in Pokhran Region', size: 'big' },
                    { type: 'image', src: 'images/pokhran/3.jpg', caption: 'Ramdevra Sacred Water Source', size: 'big' },
                    { type: 'image', src: 'images/pokhran/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/pokhran/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/pokhran/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/pokhran/7.jpg', size: 'normal' }
                ];
                break;
            case 'badabagh':
                mediaFiles = [
                    { type: 'image', src: 'images/badabagh/1.jpg', caption: 'Badabagh - Historical Water Conservation Site', size: 'big' },
                    { type: 'image', src: 'images/badabagh/2.jpg', caption: 'Ancient Stepwell Architecture in Badabagh', size: 'big' },
                    { type: 'image', src: 'images/badabagh/3.jpg', caption: 'Traditional Water Harvesting System', size: 'big' },
                    { type: 'image', src: 'images/badabagh/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/badabagh/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/badabagh/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/badabagh/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/badabagh/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/badabagh/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/badabagh/10.jpg', size: 'normal' }
                ];
                break;
            case 'mokla':
                mediaFiles = [
                    { type: 'image', src: 'images/mokla/1.jpg', caption: 'Mokla - Traditional Water Body', size: 'big' },
                    { type: 'image', src: 'images/mokla/2.jpg', caption: 'Ancient Stepwell in Mokla', size: 'big' },
                    { type: 'image', src: 'images/mokla/3.jpg', caption: 'Community Water Source in Mokla', size: 'big' },
                    { type: 'image', src: 'images/mokla/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mokla/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mokla/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mokla/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mokla/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mokla/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/mokla/10.jpg', size: 'normal' }
                ];
                break;
            case 'ramgarh':
                mediaFiles = [
                    { type: 'image', src: 'images/ramgarh/1.jpg', caption: 'Ramgarh - Traditional Water Conservation Site', size: 'big' },
                    { type: 'image', src: 'images/ramgarh/2.jpg', caption: 'Ancient Stepwell in Ramgarh', size: 'big' },
                    { type: 'image', src: 'images/ramgarh/3.jpg', caption: 'Community Water Source in Ramgarh', size: 'big' },
                    { type: 'image', src: 'images/ramgarh/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ramgarh/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ramgarh/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ramgarh/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ramgarh/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ramgarh/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ramgarh/10.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ramgarh/11.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ramgarh/12.jpg', size: 'normal' }
                ];
                break;
            case 'ranigaon':
                mediaFiles = [
                    { type: 'image', src: 'images/ranigaon/1.jpg', caption: 'Ranigaon - Traditional Water Body', size: 'big' },
                    { type: 'image', src: 'images/ranigaon/2.jpg', caption: 'Ancient Stepwell in Ranigaon', size: 'big' },
                    { type: 'image', src: 'images/ranigaon/3.jpg', caption: 'Community Water Source in Ranigaon', size: 'big' },
                    { type: 'image', src: 'images/ranigaon/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/8.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/9.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/10.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/11.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/12.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/13.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/14.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/15.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/16.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/17.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/18.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ranigaon/19.jpg', size: 'normal' }
                ];
                break;
            case 'ramderiya':
                mediaFiles = [
                    { type: 'image', src: 'images/ramderiya/1.jpg', caption: 'Ramderiya - Traditional Water Conservation Site', size: 'big' },
                    { type: 'image', src: 'images/ramderiya/2.jpg', caption: 'Ancient Stepwell in Ramderiya', size: 'big' },
                    { type: 'image', src: 'images/ramderiya/3.jpg', caption: 'Community Water Source in Ramderiya', size: 'big' },
                    { type: 'image', src: 'images/ramderiya/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ramderiya/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ramderiya/6.jpg', size: 'normal' }
                ];
                break;
            case 'siyai':
                mediaFiles = [
                    { type: 'image', src: 'images/siyai/1.jpg', caption: 'Siyai - Traditional Water Body', size: 'big' },
                    { type: 'image', src: 'images/siyai/2.jpg', caption: 'Ancient Stepwell in Siyai', size: 'big' }
                ];
                break;
            case 'ramsar':
                mediaFiles = [
                    { type: 'image', src: 'images/ramsar/1.jpg', caption: 'Ramsar - Traditional Water Conservation Site', size: 'big' },
                    { type: 'image', src: 'images/ramsar/2.jpg', caption: 'Ancient Stepwell in Ramsar', size: 'big' },
                    { type: 'image', src: 'images/ramsar/3.jpg', caption: 'Community Water Source in Ramsar', size: 'big' },
                    { type: 'image', src: 'images/ramsar/4.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ramsar/5.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ramsar/6.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ramsar/7.jpg', size: 'normal' },
                    { type: 'image', src: 'images/ramsar/8.jpg', size: 'normal' }
                ];
                break;
                case 'ratangarh' :
                mediaFiles = [
                    { name: '3.jpg', src: 'images/ratangarh/3.jpg',size: 'big', caption: 'Visit Ratangarh for the traditional water body. We did not find old bawadis, and all that we found were ponds that were used to collect water for cattle. They get their supply of water from INGP (Indra Gandhi Canal Project) and other sources managed by PHED.' },
                    { name: '9.jpg', src: 'images/ratangarh/9.jpg', size: 'big', caption: 'Team RetroFlow observed the magnificent structure of Sethani Ka Johar and actively engaged with residents to gather insights about its historical significance, water usage, and cultural importance in the Churu region.' },
                    { name: '10.jpg', src: 'images/ratangarh/10.jpg', size: 'big', caption: 'Sethani Ka Johar, located in Churu, Rajasthan, is a historic water reservoir built in the late 19th century by a wealthy merchant’s wife during a devastating famine. Constructed to provide relief from water scarcity, this large johar (traditional reservoir) was designed to collect and store rainwater, serving the drinking, irrigation, and cattle needs of the community. Even today, it retains water after the monsoon and stands as a powerful symbol of philanthropy, traditional water wisdom, and community-led conservation in arid Rajasthan.' },
                    { name: '13.jpg', src: 'images/ratangarh/13.jpg', size: 'big', caption: 'Sethani Ka Johar is a historic rainwater reservoir in Churu, built in the 19th century by a merchant’s wife during a famine. It features a large rectangular tank, stone staircases, ornate chhatris, and inlet channels for rainwater collection. This beautifully designed Johar remains a symbol of charity, heritage, and traditional water wisdom.' },
                    { name: '1.jpg',  src: 'images/ratangarh/1.jpg', size: 'normal', caption: 'Ratangarh Heritage Site' },
                    { name: '2.jpg', src: 'images/ratangarh/2.jpg',size: 'normal', caption: 'Cultural Heritage of Ratangarh' },
                    { name: '4.jpg', src: 'images/ratangarh/4.jpg',size: 'normal', caption: 'Local Architecture' },
                    { name: '5.jpg', src: 'images/ratangarh/5.jpg',size: 'normal', caption: 'Traditional Buildings' },
                    { name: '6.jpg', src: 'images/ratangarh/6.jpg',size: 'normal', caption: 'Heritage Structures' },
                    { name: '7.jpg', src: 'images/ratangarh/7.jpg',size: 'normal', caption: 'Cultural Landmarks' },
                    { name: '8.jpg', src: 'images/ratangarh/8.jpg',size: 'normal', caption: 'Historical Sites' },
                    { name: '11.jpg', src: 'images/ratangarh/11.jpg', size: 'normal', caption: 'Cultural Monuments' },
                    { name: '12.jpg', src: 'images/ratangarh/12.jpg', size: 'normal', caption: 'Historical Landmarks' },
                    { name: '14.jpg', src: 'images/ratangarh/14.jpg', size: 'normal', caption: 'Heritage Architecture' },
                    { name: '15.jpg', src: 'images/ratangarh/15.jpg', size: 'normal', caption: 'Cultural Sites' },
                    { name: '16.jpg', src: 'images/ratangarh/16.jpg', size: 'normal', caption: 'Historical Buildings' }
                ];
                break
            case 'gajsar':
                mediaFiles = [
                    { type: 'image', src: 'images/gajsar/1.jpg', size: 'big', caption: 'Gajsar Heritage Site' },
                    { type: 'image', src: 'images/gajsar/2.jpg', size: 'big', caption: 'Cultural Heritage of Gajsar' },
                    { type: 'image', src: 'images/gajsar/3.jpg', size: 'big', caption: 'Historical Monuments' },
                    { type: 'image', src: 'images/gajsar/4.jpg', size: 'normal', caption: 'Local Architecture' },
                    { type: 'image', src: 'images/gajsar/5.jpg', size: 'normal', caption: 'Traditional Buildings' },
                    { type: 'image', src: 'images/gajsar/6.jpg', size: 'normal', caption: 'Heritage Structures' },
                    { type: 'image', src: 'images/gajsar/7.jpg', size: 'normal', caption: 'Cultural Landmarks' },
                    { type: 'image', src: 'images/gajsar/8.jpg', size: 'normal', caption: 'Historical Sites' },
                    { type: 'image', src: 'images/gajsar/9.jpg', size: 'normal', caption: 'Ancient Architecture' }
                ];
                break
            case 'dadrewa':
                mediaFiles = [
                    { type: 'image', src: 'images/dadrewa/1.jpg', size: 'big', caption: 'Dadrewa Heritage Site' },
                    { type: 'image', src: 'images/dadrewa/2.jpg', size: 'big', caption: 'Cultural Heritage of Dadrewa' },
                    { type: 'image', src: 'images/dadrewa/3.jpg', size: 'big', caption: 'Historical Monuments' },
                    { type: 'image', src: 'images/dadrewa/4.jpg', size: 'normal', caption: 'Local Architecture' },
                    { type: 'image', src: 'images/dadrewa/5.jpg', size: 'normal', caption: 'Traditional Buildings' },
                    { type: 'image', src: 'images/dadrewa/6.jpg', size: 'normal', caption: 'Heritage Structures' },
                    { type: 'image', src: 'images/dadrewa/7.jpg', size: 'normal', caption: 'Cultural Landmarks' },
                    { type: 'image', src: 'images/dadrewa/8.jpg', size: 'normal', caption: 'Historical Sites' },
                    { type: 'image', src: 'images/dadrewa/9.jpg', size: 'normal', caption: 'Ancient Architecture' },
                    { type: 'image', src: 'images/dadrewa/10.jpg', size: 'normal', caption: 'Heritage Buildings' },
                    { type: 'image', src: 'images/dadrewa/11.jpg', size: 'normal', caption: 'Cultural Monuments' },
                    { type: 'image', src: 'images/dadrewa/12.jpg', size: 'normal', caption: 'Historical Landmarks' },
                    { type: 'image', src: 'images/dadrewa/13.jpg', size: 'normal', caption: 'Traditional Sites' },
                    { type: 'image', src: 'images/dadrewa/14.jpg', size: 'normal', caption: 'Heritage Architecture' },
                    { type: 'image', src: 'images/dadrewa/15.jpg', size: 'normal', caption: 'Cultural Sites' },
                    { type: 'image', src: 'images/dadrewa/16.jpg', size: 'normal', caption: 'Historical Buildings' },
                    { type: 'image', src: 'images/dadrewa/17.jpg', size: 'normal', caption: 'Ancient Monuments' },
                    { type: 'image', src: 'images/dadrewa/18.jpg', size: 'normal', caption: 'Heritage Structures' },
                    { type: 'image', src: 'images/dadrewa/19.jpg', size: 'normal', caption: 'Cultural Architecture' },
                    { type: 'image', src: 'images/dadrewa/20.jpg', size: 'normal', caption: 'Historical Sites' },
                    { type: 'image', src: 'images/dadrewa/21.jpg', size: 'normal', caption: 'Traditional Buildings' },
                    { type: 'image', src: 'images/dadrewa/22.jpg', size: 'normal', caption: 'Heritage Monuments' },
                    { type: 'image', src: 'images/dadrewa/23.jpg', size: 'normal', caption: 'Cultural Landmarks' },
                    { type: 'image', src: 'images/dadrewa/24.jpg', size: 'normal', caption: 'Historical Architecture' },
                    { type: 'image', src: 'images/dadrewa/25.jpg', size: 'normal', caption: 'Ancient Sites' },
                    { type: 'image', src: 'images/dadrewa/26.jpg', size: 'normal', caption: 'Heritage Buildings' },
                    { type: 'image', src: 'images/dadrewa/27.jpg', size: 'normal', caption: 'Cultural Structures' }
                ];
                break
                case 'amet':
                mediaFiles = [
                    { type: 'image', src: 'images/amet/1.jpg', size: 'big', caption: 'Amet Heritage Site' },
                    { type: 'image', src: 'images/amet/2.jpg', size: 'big', caption: 'Cultural Heritage of Amet' },
                    { type: 'image', src: 'images/amet/3.jpg', size: 'big', caption: 'Historical Monuments' },
                    { type: 'image', src: 'images/amet/4.jpg', size: 'normal', caption: 'Local Architecture' },
                    { type: 'image', src: 'images/amet/5.jpg', size: 'normal', caption: 'Traditional Buildings' },
                    { type: 'image', src: 'images/amet/6.jpg', size: 'normal', caption: 'Heritage Structures' },
                    { type: 'image', src: 'images/amet/7.jpg', size: 'normal', caption: 'Cultural Landmarks' }
                ];
                break
                case 'kelwa':
                mediaFiles = [
                    { type: 'image', src: 'images/kelwa/1.jpg', size: 'big', caption: 'Kelwa Heritage Site' },
                    { type: 'image', src: 'images/kelwa/2.jpg', size: 'big', caption: 'Cultural Heritage of Kelwa' },
                    { type: 'image', src: 'images/kelwa/3.jpg', size: 'big', caption: 'Historical Monuments' },
                    { type: 'image', src: 'images/kelwa/4.jpg', size: 'normal', caption: 'Local Architecture' },
                    { type: 'image', src: 'images/kelwa/5.jpg', size: 'normal', caption: 'Traditional Buildings' },
                    { type: 'image', src: 'images/kelwa/6.jpg', size: 'normal', caption: 'Heritage Structures' },
                    { type: 'image', src: 'images/kelwa/7.jpg', size: 'normal', caption: 'Cultural Landmarks' },
                    { type: 'image', src: 'images/kelwa/8.jpg', size: 'normal', caption: 'Historical Sites' },
                    { type: 'image', src: 'images/kelwa/9.jpg', size: 'normal', caption: 'Ancient Architecture' },
                    { type: 'image', src: 'images/kelwa/10.jpg', size: 'normal', caption: 'Heritage Buildings' },
                    { type: 'image', src: 'images/kelwa/11.jpg', size: 'normal', caption: 'Cultural Monuments' },
                    { type: 'image', src: 'images/kelwa/12.jpg', size: 'normal', caption: 'Historical Landmarks' },
                    { type: 'image', src: 'images/kelwa/13.jpg', size: 'normal', caption: 'Traditional Sites' },
                    { type: 'image', src: 'images/kelwa/14.jpg', size: 'normal', caption: 'Heritage Architecture' },
                    { type: 'image', src: 'images/kelwa/15.jpg', size: 'normal', caption: 'Cultural Sites' },
                    { type: 'image', src: 'images/kelwa/16.jpg', size: 'normal', caption: 'Historical Buildings' },
                    { type: 'image', src: 'images/kelwa/17.jpg', size: 'normal', caption: 'Ancient Monuments' },
                    { type: 'image', src: 'images/kelwa/18.jpg', size: 'normal', caption: 'Heritage Structures' },
                    { type: 'image', src: 'images/kelwa/19.jpg', size: 'normal', caption: 'Cultural Architecture' }
                ];
                break
                case 'rajnagar':
                mediaFiles = [
                    { type: 'image', src: 'images/rajnagar/1.jpg', size: 'big', caption: 'Rajnagar Heritage Site' },
                    { type: 'image', src: 'images/rajnagar/2.jpg', size: 'big', caption: 'Cultural Heritage of Rajnagar' },
                    { type: 'image', src: 'images/rajnagar/3.jpg', size: 'big', caption: 'Historical Monuments' },
                    { type: 'image', src: 'images/rajnagar/4.jpg', size: 'normal', caption: 'Local Architecture' },
                    { type: 'image', src: 'images/rajnagar/5.jpg', size: 'normal', caption: 'Traditional Buildings' },
                    { type: 'image', src: 'images/rajnagar/6.jpg', size: 'normal', caption: 'Heritage Structures' },
                    { type: 'image', src: 'images/rajnagar/7.jpg', size: 'normal', caption: 'Cultural Landmarks' },
                    { type: 'image', src: 'images/rajnagar/8.jpg', size: 'normal', caption: 'Historical Sites' },
                    { type: 'image', src: 'images/rajnagar/9.jpg', size: 'normal', caption: 'Ancient Architecture' },
                    { type: 'image', src: 'images/rajnagar/10.jpg', size: 'normal', caption: 'Heritage Buildings' },
                    { type: 'image', src: 'images/rajnagar/11.jpg', size: 'normal', caption: 'Cultural Monuments' },
                    { type: 'image', src: 'images/rajnagar/12.jpg', size: 'normal', caption: 'Historical Landmarks' },
                    { type: 'image', src: 'images/rajnagar/13.jpg', size: 'normal', caption: 'Traditional Sites' },
                    { type: 'image', src: 'images/rajnagar/14.jpg', size: 'normal', caption: 'Heritage Architecture' },
                    { type: 'image', src: 'images/rajnagar/15.jpg', size: 'normal', caption: 'Cultural Sites' },
                    { type: 'image', src: 'images/rajnagar/16.jpg', size: 'normal', caption: 'Historical Buildings' },
                    { type: 'image', src: 'images/rajnagar/17.jpg', size: 'normal', caption: 'Ancient Monuments' }
                ];
                break
                case 'rajasmand':
                mediaFiles = [
                    { type: 'image', src: 'images/rajasmand/1.jpg', size: 'big', caption: 'Rajasmand Lake - Scenic View' },
                    { type: 'image', src: 'images/rajasmand/2.jpg', size: 'big', caption: 'Rajasmand Lake - Tranquil Waters' },
                    { type: 'image', src: 'images/rajasmand/3.jpg', size: 'normal', caption: 'Rajasmand Lake - Sunset' },
                    { type: 'image', src: 'images/rajasmand/4.jpg', size: 'normal', caption: 'Rajasmand Lake - Heritage Site' }
                ];
                break
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