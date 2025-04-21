import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

function Home() {
  return (
    <div className="w-screen min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-2">UniDine</h1>
        <p className="text-gray-500 text-center mb-12">Instagram automation tool for food businesses</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Instagram Integration</CardTitle>
              <CardDescription>Connect your Instagram Business accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Seamlessly integrate with Instagram's Graph API to automate responses, monitor comments,
                and enhance your social media presence.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Connect Instagram</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Replies</CardTitle>
              <CardDescription>Automated intelligent responses</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Leverage AI to automatically respond to comments and messages with contextually
                appropriate and on-brand replies.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Configure AI</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Real-time Webhooks</CardTitle>
              <CardDescription>Instant notifications and responses</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Receive real-time updates when users interact with your Instagram content
                and trigger automated workflows instantly.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Setup Webhooks</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Recommendations</CardTitle>
              <CardDescription>Share and discover great food places</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Use UniDine to share restaurant recommendations and discover new dining experiences
                through social media interactions.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Explore Restaurants</Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="flex justify-center">
          <Button size="lg">Get Started</Button>
        </div>
        
        <p className="text-xs text-gray-400 mt-16 text-center">
          UniDine - Connecting restaurants with customers through Instagram automation
          <br />
          Powered by Instagram Graph API, OpenAI, and MongoDB
        </p>
      </div>
    </div>
  );
}

export default Home;
