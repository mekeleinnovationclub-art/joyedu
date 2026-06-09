'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { teacherApi } from '@/lib/teacher-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

const EXPERTISE_OPTIONS = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Cloud Computing',
  'Cybersecurity',
  'UI/UX Design',
  'Game Development',
  'Blockchain',
  'Programming Languages',
  'Software Architecture',
];

export function ApplyTeacherForm() {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(['']);
  const [socialLinks, setSocialLinks] = useState({
    linkedin: '',
    github: '',
    twitter: '',
    website: '',
  });

  const toggleExpertise = (item: string) => {
    setExpertise(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const addPortfolioLink = () => {
    setPortfolioLinks([...portfolioLinks, '']);
  };

  const removePortfolioLink = (index: number) => {
    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index));
  };

  const updatePortfolioLink = (index: number, value: string) => {
    const newLinks = [...portfolioLinks];
    newLinks[index] = value;
    setPortfolioLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken) {
      toast.error('You must be logged in to apply');
      return;
    }

    if (expertise.length === 0) {
      toast.error('Please select at least one area of expertise');
      return;
    }

    if (bio.length < 50) {
      toast.error('Bio must be at least 50 characters');
      return;
    }

    if (experience.length < 50) {
      toast.error('Experience must be at least 50 characters');
      return;
    }

    const validPortfolioLinks = portfolioLinks.filter(link => link.trim() !== '');

    setLoading(true);

    try {
      await teacherApi.createApplication(
        {
          bio,
          expertise,
          experience,
          portfolioLinks: validPortfolioLinks,
          socialLinks: Object.fromEntries(
            Object.entries(socialLinks).filter(([_, v]) => v.trim() !== '')
          ) as any,
        },
        accessToken
      );

      toast.success('Teacher application submitted successfully!');
      
      // Reset form
      setBio('');
      setExperience('');
      setExpertise([]);
      setPortfolioLinks(['']);
      setSocialLinks({ linkedin: '', github: '', twitter: '', website: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Apply as a Teacher</CardTitle>
            <CardDescription>
              Share your expertise and start teaching on JoyEdu
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio *</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself and your teaching philosophy..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              required
              minLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 50 characters
            </p>
          </div>

          {/* Expertise */}
          <div className="space-y-2">
            <Label>Areas of Expertise *</Label>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_OPTIONS.map((option) => (
                <Badge
                  key={option}
                  variant={expertise.includes(option) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleExpertise(option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select at least one area
            </p>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">Teaching Experience *</Label>
            <Textarea
              id="experience"
              placeholder="Describe your teaching experience, previous courses, etc..."
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={4}
              required
              minLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 50 characters
            </p>
          </div>

          {/* Portfolio Links */}
          <div className="space-y-2">
            <Label>Portfolio Links</Label>
            {portfolioLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => updatePortfolioLink(index, e.target.value)}
                />
                {portfolioLinks.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePortfolioLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPortfolioLink}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Link
            </Button>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <Label>Social Links (Optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/..."
                  value={socialLinks.linkedin}
                  onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github" className="text-sm">GitHub</Label>
                <Input
                  id="github"
                  placeholder="https://github.com/..."
                  value={socialLinks.github}
                  onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter" className="text-sm">Twitter</Label>
                <Input
                  id="twitter"
                  placeholder="https://twitter.com/..."
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm">Website</Label>
                <Input
                  id="website"
                  placeholder="https://..."
                  value={socialLinks.website}
                  onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Application
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
