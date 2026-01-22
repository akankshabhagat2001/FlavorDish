
export const RESTAURANTS = [
  {
    id: '1',
    name: 'The Biryani House',
    cuisine: 'Hyderabadi • Biryani • Kebabs',
    rating: 4.8,
    deliveryTime: '30-45 min',
    deliveryFee: 40,
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1200&auto=format&fit=crop',
    menu: [
      { id: 'm1', name: 'Chicken Dum Biryani', description: 'Authentic Hyderabadi spice-infused basmati rice with tender chicken.', price: 320, category: 'Main', image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=600&auto=format&fit=crop', rating: 4.9, prepTime: '25 min' },
      { id: 'm13', name: 'Vegetable Dum Biryani', description: 'Fragrant long-grain rice cooked with garden-fresh vegetables and secret spices.', price: 260, category: 'Main', image: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=600&auto=format&fit=crop', rating: 4.6, prepTime: '20 min' },
      { id: 'm2', name: 'Mutton Seekh Kebab', description: 'Minced mutton skewers grilled in a tandoor.', price: 280, category: 'Starters', image: 'https://images.unsplash.com/photo-1601050690597-df056fb04791?q=80&w=600&auto=format&fit=crop', rating: 4.7, prepTime: '15 min' },
      { id: 'm3', name: 'Double Ka Meetha', description: 'Traditional bread pudding dessert with saffron and dry fruits.', price: 120, category: 'Dessert', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=600&auto=format&fit=crop', rating: 4.8, prepTime: '10 min' },
    ]
  },
  {
    id: '2',
    name: 'Southern Spice',
    cuisine: 'South Indian • Dosa • Healthy',
    rating: 4.6,
    deliveryTime: '20-35 min',
    deliveryFee: 30,
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?q=80&w=1200&auto=format&fit=crop',
    menu: [
      { id: 'm4', name: 'Ghee Podi Roast Dosa', description: 'Crispy dosa with aromatic podi powder and pure ghee.', price: 180, category: 'Main', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=600&auto=format&fit=crop', rating: 4.8, prepTime: '12 min' },
      { id: 'm14', name: 'Spicy Masala Dosa', description: 'Large crispy dosa filled with a spicy and savory potato tempering.', price: 160, category: 'Main', image: 'https://images.unsplash.com/photo-1630409351241-e90e7f5e434d?q=80&w=600&auto=format&fit=crop', rating: 4.7, prepTime: '12 min' },
      { id: 'm5', name: 'Steamed Idli (2 pcs)', description: 'Soft and fluffy rice cakes served with sambar and chutney.', price: 90, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=600&auto=format&fit=crop', rating: 4.5, prepTime: '8 min' },
      { id: 'm6', name: 'Filter Coffee', description: 'Authentic South Indian degree coffee.', price: 60, category: 'Drinks', image: 'https://images.unsplash.com/photo-1594631252845-29fc4586c3d7?q=80&w=600&auto=format&fit=crop', rating: 4.9, prepTime: '5 min' },
    ]
  },
  {
    id: '3',
    name: 'Punjabi Dhaba',
    cuisine: 'North Indian • Tandoori • Curries',
    rating: 4.7,
    deliveryTime: '40-55 min',
    deliveryFee: 50,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=1200&auto=format&fit=crop',
    menu: [
      { id: 'm15', name: 'Creamy Butter Chicken', description: 'The ultimate North Indian indulgence. Chicken cooked in a rich, buttery tomato sauce.', price: 380, category: 'Main', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=600&auto=format&fit=crop', rating: 4.9, prepTime: '30 min' },
      { id: 'm7', name: 'Paneer Butter Masala', description: 'Creamy tomato-based curry with chunks of fresh cottage cheese.', price: 290, category: 'Main', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=600&auto=format&fit=crop', rating: 4.9, prepTime: '20 min' },
      { id: 'm9', name: 'Dal Makhani', description: 'Slow-cooked black lentils with cream and butter.', price: 240, category: 'Main', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=600&auto=format&fit=crop', rating: 4.7, prepTime: '45 min' },
      { id: 'm8', name: 'Butter Naan (1 pc)', description: 'Soft tandoori bread glazed with premium butter.', price: 45, category: 'Breads', image: 'https://images.unsplash.com/photo-1533777464539-e3397430e13b?q=80&w=600&auto=format&fit=crop', rating: 4.8, prepTime: '5 min' },
    ]
  },
  {
    id: '4',
    name: 'Mumbai Chowpatty',
    cuisine: 'Street Food • Chaat • Quick Bites',
    rating: 4.5,
    deliveryTime: '15-25 min',
    deliveryFee: 20,
    image: 'https://images.unsplash.com/photo-1626132646529-5003b508308d?q=80&w=1200&auto=format&fit=crop',
    menu: [
      { id: 'm10', name: 'Special Pav Bhaji', description: 'Spicy mashed vegetable curry served with buttery soft buns.', price: 160, category: 'Street Food', image: 'https://images.unsplash.com/photo-1606491956689-2ea8c5383c84?q=80&w=600&auto=format&fit=crop', rating: 4.7, prepTime: '10 min' },
      { id: 'm20', name: 'Crispy Samosas (2 pcs)', description: 'Flaky pastry filled with spiced potatoes and green peas.', price: 60, category: 'Street Food', image: 'https://images.unsplash.com/photo-1601050690597-df056fb04791?q=80&w=600&auto=format&fit=crop', rating: 4.8, prepTime: '5 min' },
      { id: 'm11', name: 'Vada Pav (2 pcs)', description: 'Mumbai\'s favorite spicy potato fritter burger.', price: 80, category: 'Street Food', image: 'https://images.unsplash.com/photo-1623911834246-86d708f51259?q=80&w=600&auto=format&fit=crop', rating: 4.9, prepTime: '5 min' },
    ]
  }
];
