import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

const InstagramConnect = ({ onConnectionComplete }) => {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already connected
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/instagram/status');
        const data = await response.json();
        
        if (data.connected) {
          setConnected(true);
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error checking Instagram connection:', error);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = () => {
    setLoading(true);
    // Redirect to our authentication endpoint
    window.location.href = '/auth';
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/instagram/disconnect', { method: 'POST' });
      setConnected(false);
      setUser(null);
    } catch (error) {
      console.error('Error disconnecting Instagram:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
          Instagram Connection
        </CardTitle>
        <CardDescription>
          Connect your Instagram business account to receive restaurant recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connected && user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user.profile_pic ? (
                  <img src={user.profile_pic} alt={user.username} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-bold">{user.username?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="font-medium">{user.username}</p>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Connected
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your Instagram account is connected. You can now message our bot to save restaurant recommendations!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Instagram account to use UniDine's features. When you message our bot with restaurant 
              information, we'll automatically save it to your profile.
            </p>
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
              <strong>Note:</strong> You need a business or creator Instagram account for this feature to work.
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {connected ? (
          <Button variant="outline" onClick={handleDisconnect} className="w-full">
            Disconnect Account
          </Button>
        ) : (
          <Button onClick={handleConnect} disabled={loading} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
            {loading ? "Connecting..." : "Connect Instagram"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default InstagramConnect; 