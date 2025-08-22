import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Grid,
  Button,
  Link
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  HelpOutline as HelpIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Book as BookIcon,
  QuestionAnswer as QuestionAnswerIcon
} from '@mui/icons-material';
import { PageHeader } from '../components/common';
import { Link as RouterLink } from 'react-router-dom';

const faqs = [
  {
    question: 'How do I schedule an inspection?',
    answer: 'To schedule an inspection, navigate to the Inspections page and click the "Schedule Inspection" button. Fill in the required details including supplier, date, and inspection type.'
  },
  {
    question: 'How can I add a new supplier?',
    answer: 'Go to the Suppliers page and click "Add Supplier". Fill in the supplier information form including company details, contact information, and compliance certifications.'
  },
  {
    question: 'Where can I view inspection reports?',
    answer: 'Completed inspection reports can be found in the Reports section. You can filter by date, supplier, or inspection type to find specific reports.'
  },
  {
    question: 'How do I update my profile information?',
    answer: 'Click on your profile icon in the top right corner and select "Profile". From there, you can update your personal information, change your password, and manage your preferences.'
  },
  {
    question: 'What are the different user roles?',
    answer: 'AeroSuite supports multiple user roles including Inspector, Manager, Admin, and Customer. Each role has specific permissions and access levels within the system.'
  },
  {
    question: 'How do I export data?',
    answer: 'Most data tables in AeroSuite have an export option. Look for the export button (usually in the top right of the table) to download data in CSV or Excel format.'
  }
];

const Help: React.FC = () => {
  const [expanded, setExpanded] = React.useState<any>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box>
      <PageHeader
        title="Help Center"
        subtitle="Find answers to common questions and get support"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Help' },
        ]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <QuestionAnswerIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Frequently Asked Questions</Typography>
              </Box>
              
              {faqs.map((faq, index: any) => (
                <Accordion
                  key={index}
                  expanded={expanded === `panel${index}`}
                  onChange={handleChange(`panel${index}`)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`panel${index}bh-content`}
                    id={`panel${index}bh-header`}
                  >
                    <Typography>{faq.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography color="text.secondary">
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BookIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">User Guides</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    component={RouterLink}
                    to="/docs/getting-started"
                    sx={{ justifyContent: 'flex-start', p: 2 }}
                  >
                    Getting Started Guide
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    component={RouterLink}
                    to="/docs/inspections"
                    sx={{ justifyContent: 'flex-start', p: 2 }}
                  >
                    Inspection Process Guide
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    component={RouterLink}
                    to="/docs/suppliers"
                    sx={{ justifyContent: 'flex-start', p: 2 }}
                  >
                    Supplier Management Guide
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    component={RouterLink}
                    to="/docs/reports"
                    sx={{ justifyContent: 'flex-start', p: 2 }}
                  >
                    Reports & Analytics Guide
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HelpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Need More Help?</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Can't find what you're looking for? Our support team is here to help.
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Email: <Link href="mailto:support@aerosuite.com">support@aerosuite.com</Link>
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Phone: <Link href="tel:+18005551234">1-800-555-1234</Link>
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Support Hours: Monday - Friday, 8:00 AM - 6:00 PM EST
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Tips
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Keyboard Shortcuts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Press <strong>?</strong> anywhere in the app to view available keyboard shortcuts.
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Search
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use the search bar in the header to quickly find suppliers, inspections, or reports.
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure your notification preferences in Settings to stay updated on important events.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Help;