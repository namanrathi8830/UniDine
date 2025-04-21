// [build] library: 'shadcn'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

const meta = {
  title: "ui/Table",
  component: Table,
  tags: ["autodocs"],
  argTypes: {},
};
export default meta;

export const Default = {
  render: () => {
    return (
      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow key={"INV001"}>
            <TableCell className="font-medium">{"INV001"}</TableCell>
            <TableCell>{"Paid"}</TableCell>
            <TableCell>{"Credit Card"}</TableCell>
            <TableCell className="text-right">{"$250.00"}</TableCell>
          </TableRow>
          <TableRow key={"INV002"}>
            <TableCell className="font-medium">{"INV002"}</TableCell>
            <TableCell>{"Pending"}</TableCell>
            <TableCell>{"PayPal"}</TableCell>
            <TableCell className="text-right">{"$150.00"}</TableCell>
          </TableRow>
          <TableRow key={"INV003"}>
            <TableCell className="font-medium">{"INV003"}</TableCell>
            <TableCell>{"Unpaid"}</TableCell>
            <TableCell>{"Bank Transfer"}</TableCell>
            <TableCell className="text-right">{"$450.00"}</TableCell>
          </TableRow>
          <TableRow key={"INV004"}>
            <TableCell className="font-medium">{"INV004"}</TableCell>
            <TableCell>{"Pending"}</TableCell>
            <TableCell>{"Stripe"}</TableCell>
            <TableCell className="text-right">{"$250.00"}</TableCell>
          </TableRow>
          <TableRow key={"INV005"}>
            <TableCell className="font-medium">{"INV005"}</TableCell>
            <TableCell>{"Paid"}</TableCell>
            <TableCell>{"Credit Card"}</TableCell>
            <TableCell className="text-right">{"$50.00"}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  },
  args: {},
};

const axios = require('axios');
require('dotenv').config();

class InstagramAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://graph.instagram.com';
    this.apiVersion = 'v18.0'; // Update this to the latest version if needed
  }

  // Get basic profile information
  async getProfile() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/me`,
        {
          params: {
            fields: 'id,username',
            access_token: this.accessToken
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get user's media
  async getMedia(limit = 10) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/me/media`,
        {
          params: {
            fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username',
            limit,
            access_token: this.accessToken
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching media:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get information about a specific media post
  async getMediaById(mediaId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/${mediaId}`,
        {
          params: {
            fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username',
            access_token: this.accessToken
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching media by ID:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = InstagramAPI;
