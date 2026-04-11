## Fronend folder structure

```
/frontend 
├── app/                        
# Expo Router Pages 
│   ├── (tabs)/                 
│   │   ├── _layout.tsx 
│   │   ├── index.tsx           
│   │   ├── explore.tsx 
│   │   ├── ride.tsx            
│   │   └── profile.tsx         
│   ├── auth/                   
│   │   ├── _layout.tsx 
│   │   ├── login.tsx 
│   │   └── signup.tsx 
│   ├── room/ 
│   │   └── [id].tsx            
│   ├── _layout.tsx             
│   └── index.tsx               
├── src/ 
│   ├── components/             
│   │   ├── common/             
│   │   ├── feed/               
│   │   ├── map/                
│   │   └── chat/               
│   ├── contexts/               
# Bottom Tab Navigator Layout 
# Home Feed 
# Live Map / Enroute 
# User Dashboard 
# Authentication Flow 
# Dynamic Room Details & E2E Chat 
# Root Provider Tree 
# Splash / Auth Check 
# Reusable UI components 
# Buttons, Inputs, Avatars 
# PostCard, CommentModal 
# MapOverlay, RiderMarker 
# EncryptedMessageBubble 
# React Context Providers 
│   │   ├── AuthContext.tsx 
│   │   ├── RideContext.tsx 
│   │   └── E2EContext.tsx      # Handles Cryptography / Key Pairs 
│   ├── services/               
# API wrappers 
│   │   ├── AuthService.ts 
│   │   ├── FeedService.ts 
│   │   ├── GarageService.ts 
│   │   └── ChatService.ts 
│   ├── hooks/                  
# Custom React Hooks 
│   │   ├── useLocation.ts 
│   │   └── useWebSocket.ts 
│   ├── utils/                  
# Helper functions 
│   │   ├── crypto.ts           
│   │   └── formatters.ts 
│   └── theme/                  
├── assets/                     
# E2E Encryption/Decryption logic 
# Colors, Typography, Metrics 
# Images, Fonts, Icons 
├── app.json                    
├── package.json 
└── tsconfig.json 
# Expo config

```