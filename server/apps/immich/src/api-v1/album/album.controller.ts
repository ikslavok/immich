import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  Put,
  Query,
  Response,
} from '@nestjs/common';
import { ParseMeUUIDPipe } from '../validation/parse-me-uuid-pipe';
import { AlbumService } from './album.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { AddAssetsDto } from './dto/add-assets.dto';
import { AddUsersDto } from './dto/add-users.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AlbumResponseDto } from '@app/domain';
import { AlbumCountResponseDto } from './response-dto/album-count-response.dto';
import { AddAssetsResponseDto } from './response-dto/add-assets-response.dto';
import { Response as Res } from 'express';
import {
  IMMICH_ARCHIVE_COMPLETE,
  IMMICH_ARCHIVE_FILE_COUNT,
  IMMICH_CONTENT_LENGTH_HINT,
} from '../../constants/download.constant';
import { DownloadDto } from '../asset/dto/download-library.dto';
import { CreateAlbumShareLinkDto as CreateAlbumSharedLinkDto } from './dto/create-album-shared-link.dto';
import { AlbumIdDto } from './dto/album-id.dto';

@ApiTags('Album')
@Controller('album')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Authenticated()
  @Get('count-by-user-id')
  async getAlbumCountByUserId(@GetAuthUser() authUser: AuthUserDto): Promise<AlbumCountResponseDto> {
    return this.albumService.getAlbumCountByUserId(authUser);
  }

  @Authenticated()
  @Post()
  async createAlbum(@GetAuthUser() authUser: AuthUserDto, @Body(ValidationPipe) createAlbumDto: CreateAlbumDto) {
    return this.albumService.create(authUser, createAlbumDto);
  }

  @Authenticated()
  @Put('/:albumId/users')
  async addUsersToAlbum(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) addUsersDto: AddUsersDto,
    @Param() { albumId }: AlbumIdDto,
  ) {
    return this.albumService.addUsersToAlbum(authUser, addUsersDto, albumId);
  }

  @Authenticated({ isShared: true })
  @Put('/:albumId/assets')
  async addAssetsToAlbum(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) addAssetsDto: AddAssetsDto,
    @Param() { albumId }: AlbumIdDto,
  ): Promise<AddAssetsResponseDto> {
    return this.albumService.addAssetsToAlbum(authUser, addAssetsDto, albumId);
  }

  @Authenticated({ isShared: true })
  @Get('/:albumId')
  async getAlbumInfo(@GetAuthUser() authUser: AuthUserDto, @Param() { albumId }: AlbumIdDto) {
    return this.albumService.getAlbumInfo(authUser, albumId);
  }

  @Authenticated()
  @Delete('/:albumId/assets')
  async removeAssetFromAlbum(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) removeAssetsDto: RemoveAssetsDto,
    @Param() { albumId }: AlbumIdDto,
  ): Promise<AlbumResponseDto> {
    return this.albumService.removeAssetsFromAlbum(authUser, removeAssetsDto, albumId);
  }

  @Authenticated()
  @Delete('/:albumId')
  async deleteAlbum(@GetAuthUser() authUser: AuthUserDto, @Param() { albumId }: AlbumIdDto) {
    return this.albumService.deleteAlbum(authUser, albumId);
  }

  @Authenticated()
  @Delete('/:albumId/user/:userId')
  async removeUserFromAlbum(
    @GetAuthUser() authUser: AuthUserDto,
    @Param() { albumId }: AlbumIdDto,
    @Param('userId', new ParseMeUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.albumService.removeUserFromAlbum(authUser, albumId, userId);
  }

  @Authenticated()
  @Patch('/:albumId')
  async updateAlbumInfo(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) updateAlbumInfoDto: UpdateAlbumDto,
    @Param() { albumId }: AlbumIdDto,
  ) {
    return this.albumService.updateAlbumInfo(authUser, updateAlbumInfoDto, albumId);
  }

  @Authenticated({ isShared: true })
  @Get('/:albumId/download')
  @ApiOkResponse({ content: { 'application/zip': { schema: { type: 'string', format: 'binary' } } } })
  async downloadArchive(
    @GetAuthUser() authUser: AuthUserDto,
    @Param() { albumId }: AlbumIdDto,
    @Query(new ValidationPipe({ transform: true })) dto: DownloadDto,
    @Response({ passthrough: true }) res: Res,
  ) {
    this.albumService.checkDownloadAccess(authUser);

    const { stream, fileName, fileSize, fileCount, complete } = await this.albumService.downloadArchive(
      authUser,
      albumId,
      dto,
    );
    res.attachment(fileName);
    res.setHeader(IMMICH_CONTENT_LENGTH_HINT, fileSize);
    res.setHeader(IMMICH_ARCHIVE_FILE_COUNT, fileCount);
    res.setHeader(IMMICH_ARCHIVE_COMPLETE, `${complete}`);
    return stream;
  }

  @Authenticated()
  @Post('/create-shared-link')
  async createAlbumSharedLink(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) createAlbumShareLinkDto: CreateAlbumSharedLinkDto,
  ) {
    return this.albumService.createAlbumSharedLink(authUser, createAlbumShareLinkDto);
  }
}
