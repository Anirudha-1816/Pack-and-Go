// src/api/destinationsApi.js
// Hardcoded for now. Put your photos/videos in  public/destinations/
//
// To use your API later, replace the body of getDestinations with:
//   return res.data;
//
// Your API should return a list shaped like this:
//   { id, type: "image" | "video", src, poster?, title, place }


const destinations = [
  {
    id: 1,
    type: "video",
    src: "/destinations/manali.mp4",
    poster: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=85",
    title: "Manali Mountain Escape",
    place: "Himachal Pradesh",
  },
  {
    id: 2,
    type: "image",
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85",
    title: "Spiti Valley Road Trip",
    place: "Himachal Pradesh",
  },
  {
    id: 3,
    type: "video",
    src: "/destinations/goa.mp4",
    poster: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=85",
    title: "Goa Beach Escape",
    place: "Goa",
  },
  {
    id: 4,
    type: "image",
    src: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=1200&q=85",
    title: "Royal Jaipur Experience",
    place: "Rajasthan",
  },
  {
    id: 5,
    type: "video",
    src: "/destinations/kerala.mp4",
    poster: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=85",
    title: "Kerala Backwater Journey",
    place: "Kerala",
  },
  {
    id: 6,
    type: "image",
    src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85",
    title: "Ladakh Bike Expedition",
    place: "Ladakh",
  },
  {
    id: 7,
    type: "image",
    src: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=85",
    title: "Andaman Island Escape",
    place: "Andaman & Nicobar",
  },
  {
    id: 8,
    type: "video",
    src: "/destinations/kashmir.mp4",
    poster: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1200&q=85",
    title: "Kashmir Valley Retreat",
    place: "Jammu & Kashmir",
  },
  {
    id: 9,
    type: "image",
    src: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200&q=85",
    title: "Jaisalmer Desert Safari",
    place: "Rajasthan",
  },
  {
    id: 10,
    type: "image",
    src: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=85",
    title: "Kathmandu Mountain Trails",
    place: "Nepal",
  },
  {
    id: 11,
    type: "video",
    src: "/destinations/meghalaya.mp4",
    poster: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=85",
    title: "Meghalaya Nature Trails",
    place: "Meghalaya",
  },
  {
    id: 12,
    type: "image",
    src: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200&q=85",
    title: "Tropical Island Adventure",
    place: "Lakshadweep",
  },
  {
    id: 13,
    type: "image",
    src: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&q=85",
    title: "Mountain Stargazing Camp",
    place: "Himachal Pradesh",
  },
  {
    id: 14,
    type: "video",
    src: "/destinations/varanasi.mp4",
    poster: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200&q=85",
    title: "Varanasi Heritage Journey",
    place: "Uttar Pradesh",
  },
  {
    id: 15,
    type: "image",
    src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&q=85",
    title: "Lakeside Weekend Escape",
    place: "Udaipur, Rajasthan",
  },
];


export async function getDestinations() {
  return destinations;
}